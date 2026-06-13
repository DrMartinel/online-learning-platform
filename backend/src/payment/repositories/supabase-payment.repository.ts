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
    // 1. Cập nhật trạng thái thanh toán thành SUCCESS
    const { error: paymentError } = await this.supabase
      .from('payments')
      .update({
        status: 'SUCCESS',
        vnp_transaction_no: vnpTransactionNo,
        updated_at: new Date().toISOString(),
      })
      .eq('vnp_txn_ref', vnpTxnRef);

    if (paymentError) {
      throw new InternalServerErrorException(`Lỗi khi cập nhật thanh toán: ${paymentError.message}`);
    }

    // 2. Ghi danh học viên vào bảng enrollments
    const { error: enrollmentError } = await this.supabase
      .from('enrollments')
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
        },
        { onConflict: 'user_id,course_id' } // Đảm bảo không bị trùng lặp
      );

    if (enrollmentError) {
       // Log lỗi, có thể cân nhắc cơ chế retry ở đây trong môi trường thực tế
      throw new InternalServerErrorException(`Lỗi khi ghi danh học viên: ${enrollmentError.message}`);
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
}