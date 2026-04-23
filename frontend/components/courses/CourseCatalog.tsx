"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import CourseCard, { type Course } from "./CourseCard";

interface CourseCatalogProps {
  initialCourses: Course[];
}

export default function CourseCatalog({ initialCourses }: CourseCatalogProps) {
  const [query, setQuery] = useState("");
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = initialCourses;

    if (showPublishedOnly) {
      list = list.filter((c) => c.isPublished);
    }

    if (query.trim()) {
      const lower = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          (c.description ?? "").toLowerCase().includes(lower)
      );
    }

    return list;
  }, [initialCourses, query, showPublishedOnly]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Section header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Khóa học nổi bật
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Khám phá tất cả khóa học trên nền tảng
          </p>
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm khóa học, chủ đề..."
            className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Published filter toggle */}
        <button
          onClick={() => setShowPublishedOnly((v) => !v)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors shadow-sm shrink-0 ${
            showPublishedOnly
              ? "bg-primary text-white border-primary"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary"
          }`}
        >
          <SlidersHorizontal size={16} />
          Đã xuất bản
        </button>
      </div>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <Search size={40} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">Không tìm thấy khóa học</p>
          <p className="text-sm mt-1">Thử từ khóa khác hoặc bỏ bộ lọc</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            {filtered.length} khóa học
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
