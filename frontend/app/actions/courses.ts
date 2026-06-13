'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createCourseAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  // 1. Lấy dữ liệu từ Form
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const thumbnailUrl = formData.get('thumbnailUrl') as string;
  
  // === LẤY VÀ ÉP KIỂU TRƯỜNG PRICE ===
  const priceStr = formData.get('price') as string;
  const parsedPrice = priceStr ? parseInt(priceStr, 10) : 0;
  const finalPrice = isNaN(parsedPrice) ? 0 : parsedPrice;

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Backend URL not configured');
  }

  // 2. Xây dựng Payload gửi lên Backend
  const payload: any = { 
    title,
    price: finalPrice 
  };
  
  if (description) payload.description = description;
  if (thumbnailUrl) payload.thumbnailUrl = thumbnailUrl;

  // 3. Gửi Request
  const res = await fetch(`${backendUrl}/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create course: ${err}`);
  }

  const course = await res.json();
  redirect(`/courses/${course.id}`);
}