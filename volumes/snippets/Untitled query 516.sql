-- 1. Xóa bỏ chính sách cũ (dựa trên JWT auth.role) để tránh trùng lặp
DROP POLICY IF EXISTS "Service role full access on courses" ON public.courses;
DROP POLICY IF EXISTS "Service role full access on lessons" ON public.lessons;
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access on user_progress" ON public.user_progress;

-- 2. Tạo chính sách RLS mới dựa trên đối tượng vai trò gốc của Postgres (TO service_role, postgres)
-- Cho phép toàn quyền đọc, ghi, sửa, xóa (FOR ALL) mà không cần kiểm tra JWT
CREATE POLICY "Service role full access on courses" 
ON public.courses FOR ALL TO service_role, postgres 
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on lessons" 
ON public.lessons FOR ALL TO service_role, postgres 
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on profiles" 
ON public.profiles FOR ALL TO service_role, postgres 
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on user_progress" 
ON public.user_progress FOR ALL TO service_role, postgres 
USING (true) WITH CHECK (true);
