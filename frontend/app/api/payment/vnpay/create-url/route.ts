import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();

    // 1. Đọc Token trực tiếp từ Cookie (Bỏ qua Supabase Client để tránh lỗi mạng Docker 127.0.0.1)
    const token = cookieStore.get("olp_session")?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Lấy IP của người dùng để truyền xuống VNPay (chống giả mạo IP)
    const ipAddr = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 3. Proxy request xuống Backend NestJS
    const backendUrl = process.env.BACKEND_URL || 'http://backend:3001';
    const response = await fetch(`${backendUrl}/payment/vnpay/create-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Đính kèm JWT để Backend Guard xác nhận User
        'x-forwarded-for': ipAddr,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Lỗi khi tạo URL thanh toán');
    }

    // Trả URL thanh toán VNPay về cho Client chuyển hướng
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}