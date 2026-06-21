import Link from "next/link";
import { PlayCircle, BookOpen, CheckCircle2 } from "lucide-react";
import { getMediaUrl } from "@/lib/supabase";

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  createdAt: string;
  price: number;
}

export interface CourseProgressInfo {
  isEnrolled: boolean;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

interface CourseCardProps {
  course: Course;
  progress?: CourseProgressInfo;
}

export default function CourseCard({ course, progress }: CourseCardProps) {
  const isCompleted = progress?.percentage === 100;
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/30 flex items-center justify-center flex-shrink-0 relative">
        {course.thumbnailUrl ? (
          <img
            src={getMediaUrl(course.thumbnailUrl)}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <PlayCircle
            size={40}
            className="text-primary/40 group-hover:text-primary/70 group-hover:scale-110 transition-all"
          />
        )}
        {isCompleted && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-semibold shadow">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hoàn thành
          </div>
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

        {progress?.isEnrolled ? (
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>{progress.completedLessons} / {progress.totalLessons} bài học</span>
              <span className="font-medium text-primary">{progress.percentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress.percentage}%`,
                  background: isCompleted ? '#22c55e' : 'var(--color-primary)',
                }}
              />
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-500 font-medium">
                <CheckCircle2 size={12} />
                Đã tham gia
              </span>
              <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-medium group-hover:bg-primary group-hover:text-white transition-colors">
                {isCompleted ? 'Xem lại' : progress.completedLessons > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <BookOpen size={12} />
              {new Date(course.createdAt).toLocaleDateString("vi-VN")}
            </span>
            <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-medium group-hover:bg-primary group-hover:text-white transition-colors">
              Xem khóa học
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
