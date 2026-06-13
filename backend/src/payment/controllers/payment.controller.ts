import { Controller, Post, Get, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentRequestDto, VNPayIPNDto } from '../dto/payment.dto';
import { Auth } from '../../iam/decorators/auth.decorator';
import { Permission } from '../../iam/decorators/permission.decorator';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';
import { GetTransactionsQueryDto } from '../dto/payment.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('vnpay/create-url')
  @Auth() // Bắt buộc user phải đăng nhập
  @Permission('action:payment:create') // Phải có URN quyền tạo thanh toán (đã cấp ở Bước 2)
  @ApiOperation({ summary: 'Tạo URL chuyển hướng sang VNPay' })
  async createPaymentUrl(
    @Body() dto: CreatePaymentRequestDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    // Lấy IP của Client (tránh lấy nhầm IP của Docker/Kong)
    const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    
    // Truyền ID từ JWT Payload (user.id)
    return this.paymentService.createPaymentUrl(user.id, dto, ipAddr);
  }

  @Get('vnpay/ipn')
  @ApiOperation({ summary: 'Webhook (IPN) do Server VNPay gọi về' })
  // ĐẶC BIỆT LƯU Ý: Endpoint IPN tuyệt đối KHÔNG gắn @Auth() hay @Permission()
  // Vì server VNPay gọi ngầm chứ không mang theo Token của User
  async handleVNPayIPN(@Query() query: VNPayIPNDto) {
    return this.paymentService.processIPN(query);
  }

  @Get('transactions')
  @Auth() // Bắt buộc đăng nhập
  @Permission('action:payment:read') // Chỉ Admin / User có quyền này mới được phép truy cập
  @ApiOperation({ summary: 'Lấy danh sách tất cả giao dịch (Dành cho Admin)' })
  async getTransactions(@Query() query: GetTransactionsQueryDto) {
    return this.paymentService.getTransactions(query);
  }
}