'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function TransactionsClientView({ initialData, meta }: { initialData: any[], meta: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Trạng thái local cho Form
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const currentStatus = searchParams.get('status') || '';

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hàm cập nhật URL (Kích hoạt Server Component fetch lại data)
  const updateFilters = (newParams: { search?: string; status?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newParams.search !== undefined) {
        if (newParams.search) params.set('search', newParams.search);
        else params.delete('search');
    }
    if (newParams.status !== undefined) {
        if (newParams.status) params.set('status', newParams.status);
        else params.delete('status');
    }
    if (newParams.page) params.set('page', newParams.page.toString());

    router.push(`?${params.toString()}`);
  };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

    const formatDate = (dateString: string) => {
    if (!isMounted) return '...';
    return new Date(dateString).toLocaleString('vi-VN'); 
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
      {/* Bộ lọc (Filters) */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
        
        {/* Ô Tìm kiếm */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm mã giao dịch (vnp_TxnRef)..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters({ search: searchInput, page: 1 })}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>

        {/* Lọc theo Trạng thái */}
        <select
          className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none"
          value={currentStatus}
          onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="SUCCESS">Thành công (SUCCESS)</option>
          <option value="PENDING">Chờ xử lý (PENDING)</option>
          <option value="FAILED">Thất bại (FAILED)</option>
        </select>
      </div>

      {/* Bảng Dữ liệu (Table) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-800">
              <th className="p-4 font-medium">Mã GD (VNPay)</th>
              <th className="p-4 font-medium">Khóa học</th>
              <th className="p-4 font-medium">Học viên</th>
              <th className="p-4 font-medium">Số tiền</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {initialData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Không tìm thấy giao dịch nào.</td>
              </tr>
            ) : (
              initialData.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-sm">
                  <td className="p-4 font-mono text-gray-700 dark:text-gray-300">{txn.vnp_txn_ref}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 truncate max-w-[150px]" title={txn.course_id}>{txn.course_id}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 truncate max-w-[150px]" title={txn.user_id}>{txn.user_id}</td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(txn.amount)}</td>
                  <td className="p-4">
                    {txn.status === 'SUCCESS' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle size={14}/> Thành công</span>}
                    {txn.status === 'PENDING' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock size={14}/> Chờ xử lý</span>}
                    {txn.status === 'FAILED' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle size={14}/> Thất bại</span>}
                  </td>
                  <td className="p-4 text-gray-500">{formatDate(txn.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang (Pagination) */}
      <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Trang <span className="font-semibold text-gray-900 dark:text-white">{meta.page}</span> / {meta.totalPages || 1}
          <span className="ml-2 hidden sm:inline">(Tổng {meta.total} giao dịch)</span>
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={() => updateFilters({ page: Math.max(1, meta.page - 1) })}
            disabled={meta.page <= 1}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => updateFilters({ page: Math.min(meta.totalPages, meta.page + 1) })}
            disabled={meta.page >= meta.totalPages || meta.totalPages === 0}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}