import Link from "next/link";
import { PlayCircle, BookOpen } from "lucide-react";

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  createdAt: string;
}

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/30 flex items-center justify-center flex-shrink-0 relative">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <PlayCircle
            size={40}
            className="text-primary/40 group-hover:text-primary/70 group-hover:scale-110 transition-all"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <BookOpen size={12} />
            {new Date(course.createdAt).toLocaleDateString("vi-VN")}
          </span>
          <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-medium group-hover:bg-primary group-hover:text-white transition-colors">
            Xem khóa học
          </span>
        </div>
      </div>
    </Link>
  );
}
