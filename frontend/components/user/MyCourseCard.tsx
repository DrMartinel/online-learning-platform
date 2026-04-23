import Link from 'next/link';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export interface EnrolledCourse {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  instructorId: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  lastActivityAt: string | null;
  firstIncompleteLessonId: string | null;
}

interface MyCourseCardProps {
  course: EnrolledCourse;
}

export default function MyCourseCard({ course }: MyCourseCardProps) {
  const isCompleted = course.percentage === 100;
  const learnHref = isCompleted
    ? `/courses/${course.id}`
    : course.firstIncompleteLessonId
      ? `/learn/${course.id}/${course.firstIncompleteLessonId}`
      : `/courses/${course.id}`;

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/50 transition-all overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 overflow-hidden">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-[var(--color-primary)]/30" />
          </div>
        )}
        {isCompleted && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-semibold shadow">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hoàn thành
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 text-base leading-snug group-hover:text-[var(--color-primary)] transition-colors">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Progress */}
        <div className="mt-auto">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>{course.completedLessons} / {course.totalLessons} bài học</span>
            <span className="font-medium text-[var(--color-primary)]">{course.percentage}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${course.percentage}%`,
                background: isCompleted
                  ? '#22c55e'
                  : 'var(--color-primary)',
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <Link
          href={learnHref}
          className="mt-2 block text-center text-sm font-semibold py-2.5 rounded-xl border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
        >
          {isCompleted ? 'Xem lại' : course.completedLessons > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
        </Link>
      </div>
    </div>
  );
}
