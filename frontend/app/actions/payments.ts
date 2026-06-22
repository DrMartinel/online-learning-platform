'use server';

import { cookies } from 'next/headers';

export async function getTransactionsAction(searchParams: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('olp_session')?.value;

    // Xây dựng query string
    const query = new URLSearchParams();
    if (searchParams.page) query.append('page', searchParams.page.toString());
    if (searchParams.limit) query.append('limit', searchParams.limit.toString());
    if (searchParams.status) query.append('status', searchParams.status);
    if (searchParams.search) query.append('search', searchParams.search);

// Nếu không có env, fallback về http://backend:3001 (tên service mặc định trong docker-compose)
const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001';

    const res = await fetch(`${backendUrl}/payment/transactions?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Đảm bảo Admin luôn xem dữ liệu mới nhất
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Chi tiết lỗi từ Backend:", res.status, errorText);
      throw new Error('Không thể tải danh sách giao dịch');
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi khi fetch transactions:", error);
    // Trả về dữ liệu rỗng nếu lỗi để UI không bị sập
    return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  }
}