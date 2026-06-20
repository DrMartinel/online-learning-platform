import Link from "next/link";

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Sub tabs inside the general content area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-250 dark:border-gray-800 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Quản lý đề thi & Tổ chức thi
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Ngân hàng đề thi và đợt thi trực tuyến
          </p>
        </div>
        <nav className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl self-start sm:self-auto">
          <Link
            href="/admin/exams"
            className="px-3.5 py-2 text-xs font-bold text-gray-650 hover:text-primary dark:text-gray-300 dark:hover:text-gray-100 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
          >
            Ngân hàng đề thi
          </Link>
          <Link
            href="/admin/exams/sessions"
            className="px-3.5 py-2 text-xs font-bold text-gray-650 hover:text-primary dark:text-gray-300 dark:hover:text-gray-100 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
          >
            Tổ chức thi
          </Link>
        </nav>
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
