import Link from "next/link";
import { PlayCircle, BookOpen, Users, Pencil } from "lucide-react";
import { getMediaUrl } from "@/lib/supabase";

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
  currentUser?: {
    id: string;
    role: string;
    permissions?: string[];
  } | null;
}

export default function CourseCard({ course, currentUser }: CourseCardProps) {
  const isAdmin = currentUser?.role === 'admin';
  const hasLessonPermission = currentUser?.permissions?.includes('action:lesson:create');
  const isInstructor = currentUser?.id === course.instructorId && hasLessonPermission;
  const canManage = isInstructor || isAdmin;

  return (
    <div
      className="group bg-white dark:bg-gray-800/55 border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative"
    >
      {/* Thumbnail */}
      <Link 
        href={`/courses/${course.id}`}
        className="aspect-video bg-gradient-to-br from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/30 flex items-center justify-center flex-shrink-0 relative overflow-hidden"
      >
        {course.thumbnailUrl ? (
          <img
            src={getMediaUrl(course.thumbnailUrl)}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <PlayCircle
            size={40}
            className="text-primary/40 group-hover:text-primary/70 group-hover:scale-110 transition-all"
          />
        )}

        {/* Draft/Published Badge on Card Thumbnail for Managers */}
        {canManage && (
          <div className="absolute top-3 left-3">
            {course.isPublished ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
                Đã xuất bản
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">
                Bản nháp
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/courses/${course.id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug text-base">
            {course.title}
          </h3>
        </Link>

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
          
          {canManage ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={`/courses/${course.id}`}
                className="text-xs bg-gray-105 dark:bg-gray-750 hover:bg-gray-150 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-xl font-semibold transition-colors border border-gray-200 dark:border-gray-700"
              >
                Xem
              </Link>
              <Link
                href={`/courses/${course.id}/edit`}
                className="text-xs bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1 border border-transparent"
              >
                <Pencil size={11} />
                Sửa
              </Link>
            </div>
          ) : (
            <Link
              href={`/courses/${course.id}`}
              className="text-xs bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1.5 rounded-xl font-semibold group-hover:bg-primary group-hover:text-white transition-colors"
            >
              Xem khóa học
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
