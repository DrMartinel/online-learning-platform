import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Inject } from '@nestjs/common';

@Injectable()
export class SupabasePaymentRepository {
constructor(
    private readonly supabase: SupabaseClient
  ) {}

  async createPayment(data: { userId: string; courseId: string; amount: number; vnpTxnRef: string }) {
    const { data: payment, error } = await this.supabase
      .from('payments')
      .insert({
        user_id: data.userId,
        course_id: data.courseId,
        amount: data.amount,
        vnp_txn_ref: data.vnpTxnRef,
        status: 'PENDING'
      })
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return payment;
  }

  async updatePaymentStatus(vnpTxnRef: string, status: 'SUCCESS' | 'FAILED', vnpTransactionNo?: string) {
    const { data: payment, error } = await this.supabase
      .from('payments')
      .update({ status, vnp_transaction_no: vnpTransactionNo, updated_at: new Date().toISOString() })
      .eq('vnp_txn_ref', vnpTxnRef)
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return payment;
  }

  async getPaymentByTxnRef(vnpTxnRef: string) {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('vnp_txn_ref', vnpTxnRef)
      .single();
    
    // Không throw error nếu không tìm thấy để xử lý logic IPN an toàn
    return data;
  }

  async enrollUserAfterPayment(vnpTxnRef: string, userId: string, courseId: string, vnpTransactionNo: string) {
    // Gọi Stored Procedure (RPC) từ Database Migration để đảm bảo an toàn dữ liệu
    const { error } = await this.supabase.rpc('enroll_user_after_payment', {
      p_vnp_txn_ref: vnpTxnRef,
      p_user_id: userId,
      p_course_id: courseId,
      p_vnp_transaction_no: vnpTransactionNo
    });

    if (error) {
      throw new InternalServerErrorException(`Lỗi Transaction khi ghi danh: ${error.message}`);
    }

    return { success: true };
  }
  
  async updatePaymentFailed(vnpTxnRef: string) {
    const { error } = await this.supabase
      .from('payments')
      .update({
        status: 'FAILED',
        updated_at: new Date().toISOString(),
      })
      .eq('vnp_txn_ref', vnpTxnRef);
      
    if (error) {
         throw new InternalServerErrorException(`Lỗi khi cập nhật thanh toán thất bại: ${error.message}`);
    }
  }

  async getTransactions(page: number, limit: number, status?: string, search?: string) {
    // 1. Khởi tạo query lấy data và đếm tổng số bản ghi
    let query = this.supabase
      .from('payments')
      .select('*', { count: 'exact' });

    // 2. Áp dụng bộ lọc (nếu có)
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      // Tìm kiếm tương đối theo mã giao dịch
      query = query.ilike('vnp_txn_ref', `%${search}%`);
    }

    // 3. Tính toán offset cho phân trang (Pagination)
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 4. Lấy dữ liệu sắp xếp theo ngày tạo mới nhất
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new InternalServerErrorException(`Lỗi khi lấy danh sách giao dịch: ${error.message}`);
    }

    return { data, count };
  }
}