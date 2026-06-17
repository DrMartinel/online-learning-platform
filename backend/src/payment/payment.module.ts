import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { SupabasePaymentRepository } from './repositories/supabase-payment.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentController],
  providers: [PaymentService, SupabasePaymentRepository],
  exports: [PaymentService],
})
export class PaymentModule {} 