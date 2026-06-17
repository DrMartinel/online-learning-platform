'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PaymentButtonProps {
  courseId: string;
  amount: number;
}

export default function PaymentButton({ courseId, amount }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaymentClick = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi lên Next.js BFF (tự động đính kèm cookies)
      const res = await fetch('/api/payment/vnpay/create-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, amount }),
      });
      
      const data = await res.json();
      
      if (data.paymentUrl) {
        // Chuyển hướng trình duyệt sang trang thanh toán của VNPay
        window.location.href = data.paymentUrl;
      } else {
        setError(data.error || 'Có lỗi xảy ra khi kết nối máy chủ thanh toán.');
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button 
        onClick={handlePaymentClick} 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin w-5 h-5 mr-2" />
        ) : null}
        {loading ? 'Đang xử lý...' : `Thanh toán ${amount.toLocaleString('vi-VN')} VNĐ`}
      </button>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}