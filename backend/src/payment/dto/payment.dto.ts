import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePaymentRequestSchema = z.object({
  courseId: z.string().uuid({ message: 'ID khóa học không hợp lệ' }),
  amount: z.number().positive({ message: 'Số tiền phải lớn hơn 0' }),
  ipAddr: z.string().optional(), 
});

export class CreatePaymentRequestDto extends createZodDto(CreatePaymentRequestSchema) {}

export const VNPayIPNSchema = z.object({
  vnp_TmnCode: z.string().optional(),
  vnp_Amount: z.string().optional(),
  vnp_BankCode: z.string().optional(),
  vnp_BankTranNo: z.string().optional(),
  vnp_CardType: z.string().optional(),
  vnp_PayDate: z.string().optional(),
  vnp_OrderInfo: z.string().optional(),
  vnp_TransactionNo: z.string().optional(),
  vnp_ResponseCode: z.string(),
  vnp_TransactionStatus: z.string().optional(),
  vnp_TxnRef: z.string(),
  vnp_SecureHashType: z.string().optional(),
  vnp_SecureHash: z.string(),
}).catchall(z.string().optional());

export class VNPayIPNDto extends createZodDto(VNPayIPNSchema) {}

// Định nghĩa schema cho query tham số
export const GetTransactionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']).optional(),
  search: z.string().optional(),
});

export class GetTransactionsQueryDto extends createZodDto(GetTransactionsQuerySchema) {}