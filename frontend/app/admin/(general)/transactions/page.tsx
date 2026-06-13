import { getTransactionsAction } from '@/app/actions/payments';
import TransactionsClientView from './TransactionsClientView';

// Sửa kiểu dữ liệu searchParams thành Promise
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // BẮT BUỘC THÊM DÒNG NÀY: Await searchParams trước khi dùng
  const resolvedParams = await searchParams;

  // Trỏ các biến vào resolvedParams thay vì searchParams
  const page = parseInt(resolvedParams.page || '1');
  const search = resolvedParams.search || '';
  const status = resolvedParams.status || '';

  // Gọi Action lấy dữ liệu từ Backend
  const response = await getTransactionsAction({ page, limit: 10, search, status });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Đơn hàng</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Theo dõi và quản lý lịch sử thanh toán khóa học qua hệ thống VNPay.
        </p>
      </div>

      <TransactionsClientView 
        initialData={response.data} 
        meta={response.meta} 
      />
    </div>
  );
}