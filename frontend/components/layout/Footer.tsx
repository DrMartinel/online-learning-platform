import Link from "next/link";
import { PlayCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <PlayCircle size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-800 dark:text-white">
            EduSpace
          </span>
        </Link>
        <p>&copy; {new Date().getFullYear()} EduSpace. All rights reserved.</p>
      </div>
    </footer>
  );
}
