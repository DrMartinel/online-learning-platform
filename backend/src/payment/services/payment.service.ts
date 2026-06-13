import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabasePaymentRepository } from '../repositories/supabase-payment.repository';
import { CreatePaymentRequestDto, VNPayIPNDto } from '../dto/payment.dto';
import * as crypto from 'crypto';
import * as qs from 'qs';
import { GetTransactionsQueryDto } from '../dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly configService: ConfigService,
    private readonly paymentRepository: SupabasePaymentRepository,
  ) {}

  async createPaymentUrl(userId: string, dto: CreatePaymentRequestDto, ipAddr: string) {
    const tmnCode = this.configService.get<string>('VNP_TMN_CODE')!;
    const secretKey = this.configService.get<string>('VNP_HASH_SECRET')!;
    const vnpUrl = this.configService.get<string>('VNP_URL')!;
    const returnUrl = this.configService.get<string>('VNP_RETURN_URL')!;

    // 1. Tính toán chuẩn xác Múi giờ GMT+7 bất chấp Server đang ở múi giờ nào
    const date = new Date();
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const vnTime = new Date(utcTime + (3600000 * 7)); // Cộng 7 tiếng
    const expireTime = new Date(vnTime.getTime() + (15 * 60000)); // Thời gian hết hạn: 15 phút sau

    // Hàm format ngày tháng YYYYMMDDHHmmss
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatTime = (d: Date) => 
      d.getFullYear().toString() + pad(d.getMonth() + 1) + pad(d.getDate()) + 
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());

    const createDate = formatTime(vnTime);
    const expireDate = formatTime(expireTime);
    
    // Tạo mã giao dịch ngẫu nhiên không trùng lặp
    const vnp_TxnRef = createDate + Math.floor(Math.random() * 10000).toString();

    // 2. Xử lý IP: VNPay Sandbox thường báo lỗi nếu truyền 127.0.0.1 hoặc IPv6
    let finalIp = ipAddr;
    if (!finalIp || finalIp === '127.0.0.1' || finalIp === '::1' || finalIp.includes('localhost')) {
       finalIp = '13.160.92.202'; // Dùng một IP Việt Nam hợp lệ để bypass Sandbox
    }

    // 3. Lưu giao dịch trạng thái PENDING vào DB
    await this.paymentRepository.createPayment({
      userId,
      courseId: dto.courseId,
      amount: dto.amount,
      vnpTxnRef: vnp_TxnRef
    });

    // 4. Khởi tạo Object chứa param
    let vnp_Params: Record<string, string | number> = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = vnp_TxnRef;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang'; // Đừng truyền chuỗi quá dài hoặc chứa ký tự đặc biệt
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = dto.amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = finalIp;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    // 5. Sắp xếp params theo chuẩn
    vnp_Params = this.sortObject(vnp_Params);

    // 6. Tạo chữ ký số
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // 7. Gắn chữ ký vào URL
    vnp_Params['vnp_SecureHash'] = signed;
    const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

    return { paymentUrl };
  }

  async processIPN(query: VNPayIPNDto) {
    let vnp_Params: Record<string, any> = { ...query };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const secretKey = this.configService.get<string>('VNP_HASH_SECRET')!;
    vnp_Params = this.sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // 1. Xác thực chữ ký
    if (secureHash !== signed) {
      return { RspCode: '97', Message: 'Checksum failed' };
    }

    const vnp_TxnRef = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const vnp_TransactionNo = vnp_Params['vnp_TransactionNo'];

    // 2. Kiểm tra giao dịch trong DB
    const payment = await this.paymentRepository.getPaymentByTxnRef(vnp_TxnRef);
    if (!payment) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // 3. Kiểm tra trạng thái giao dịch (Tránh lặp IPN)
    if (payment.status !== 'PENDING') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // 4. Cập nhật theo mã phản hồi
    if (responseCode === '00') {
      // Thành công -> Cập nhật SUCCESS và ghi danh
      await this.paymentRepository.enrollUserAfterPayment(
        vnp_TxnRef,
        payment.user_id,
        payment.course_id,
        vnp_TransactionNo
      );
      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      // Thất bại
      await this.paymentRepository.updatePaymentFailed(vnp_TxnRef);
      return { RspCode: '00', Message: 'Confirm Success' }; // VNPay yêu cầu trả 00 để xác nhận đã nhận IPN
    }
  }

  // Thuật toán sắp xếp chuẩn VNPay (Thuần JS)
  private sortObject(obj: Record<string, any>) {
    let sorted: Record<string, string> = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  async getTransactions(queryDto: GetTransactionsQueryDto) {
    const { page, limit, status, search } = queryDto;
    
    const { data, count } = await this.paymentRepository.getTransactions(
      page, 
      limit, 
      status, 
      search
    );

    // Chuẩn hóa dữ liệu trả về cho Frontend hiển thị bảng và phân trang
    return {
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      }
    };
  }
}