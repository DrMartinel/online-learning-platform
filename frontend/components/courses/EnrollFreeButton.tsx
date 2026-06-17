'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enrollFreeCourseAction } from '@/app/actions/courses';
// import { toast } from 'sonner'; // (Hoặc thư viện toast bạn đang dùng)

export default function EnrollFreeButton({ courseId }: { courseId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    setIsLoading(true);
    const result = await enrollFreeCourseAction(courseId);
    
    if (result.success) {
      // toast.success('Đăng ký thành công! Đang chuyển hướng vào bài học...');
      // Đợi action revalidate xong, giao diện sẽ tự chuyển sang nút "Vào học ngay"
      router.refresh(); 
    } else {
      // toast.error(result.error);
      alert(result.error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleEnroll}
      disabled={isLoading}
      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Đang xử lý...' : 'Đăng ký học (Miễn phí)'}
    </button>
  );
}