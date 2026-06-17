import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';

interface ReturnPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function VNPayReturnPage({ searchParams }: ReturnPageProps) {
  // Lấy các Query Parameters do VNPay gửi trả trên URL
  // Lưu ý: Đối với Next.js 15+, searchParams là một Promise nên cần await
  const params = await searchParams;
  
  // Chuyển đổi toàn bộ tham số nhận được thành chuỗi query string
  const queryString = new URLSearchParams(params as Record<string, string>).toString();

  // [TỰ ĐỘNG GỌI IPN] Giả lập Server VNPay gọi xuống Backend
  // Lưu ý: KHÔNG dùng await ở lệnh fetch này để giao diện không bị treo chờ xử lý
  const backendUrl = process.env.BACKEND_URL || 'http://backend:3001';
  fetch(`${backendUrl}/payment/vnpay/ipn?${queryString}`, { 
    method: 'GET',
    cache: 'no-store' 
  }).catch(e => console.error("Lỗi Auto IPN:", e));

  const responseCode = params['vnp_ResponseCode'] as string;
  const orderInfo = params['vnp_OrderInfo'] as string;
  const transactionNo = params['vnp_TransactionNo'] as string;
  
  // VNPay quy định vnp_ResponseCode = '00' là giao dịch thành công
  const isSuccess = responseCode === '00';

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-transparent p-4">
      <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-xl p-8 text-center">
        
        {isSuccess ? (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Cảm ơn bạn đã mua khóa học. Giao dịch <strong>{transactionNo}</strong> đã được xác nhận. Thông tin: {orderInfo}.
            </p>
            <Link 
              href="/my-courses" 
              className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Vào học ngay
            </Link>
          </>
        ) : (
          <>
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Thanh toán thất bại
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Giao dịch của bạn đã bị hủy hoặc có lỗi xảy ra trong quá trình thanh toán (Mã lỗi từ VNPay: <strong>{responseCode}</strong>). Vui lòng thử lại.
            </p>
            <Link 
              href="/courses" 
              className="inline-block w-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Quay lại danh mục
            </Link>
          </>
        )}
        
      </div>
    </div>
  );
}