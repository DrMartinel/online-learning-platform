-- Migration 00010_payment_schema.sql

-- 1. Tạo ENUM cho trạng thái thanh toán để dữ liệu được chuẩn hóa
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- 2. Tạo bảng lưu trữ thông tin thanh toán VNPay
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL, -- Số tiền thực tế (VND)
  vnp_txn_ref TEXT UNIQUE NOT NULL, -- Mã giao dịch gửi sang VNPay (bắt buộc duy nhất)
  vnp_transaction_no TEXT, -- Mã giao dịch do VNPay trả về
  vnp_bank_code TEXT, -- Mã ngân hàng thanh toán (NCB, VNPAYQR...)
  status payment_status DEFAULT 'PENDING' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. Bật RLS (Row Level Security) cho bảng payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 4. Tạo Policy cho RLS (Theo pattern hiện hành của hệ thống - phân quyền tại Backend Guard)
CREATE POLICY "Allow public full access on payments" 
  ON payments 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);