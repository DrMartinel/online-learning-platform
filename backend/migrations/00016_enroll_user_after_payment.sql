-- Migration: Tạo Stored Procedure xử lý giao dịch thanh toán an toàn
CREATE OR REPLACE FUNCTION enroll_user_after_payment(
  p_vnp_txn_ref TEXT, 
  p_user_id UUID, 
  p_course_id UUID, 
  p_vnp_transaction_no TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Cập nhật trạng thái thanh toán
  UPDATE payments 
  SET status = 'SUCCESS', vnp_transaction_no = p_vnp_transaction_no, updated_at = NOW()
  WHERE vnp_txn_ref = p_vnp_txn_ref;

  -- 2. Ghi danh (Upsert) vào bảng enrollments
  INSERT INTO enrollments (user_id, course_id) 
  VALUES (p_user_id, p_course_id)
  ON CONFLICT (user_id, course_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;