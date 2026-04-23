import { PlayCircle, FileText, Clock } from "lucide-react";

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl?: string | null;
  content?: string | null;
  orderIndex: number;
  createdAt: string;
}

interface LessonListProps {
  lessons: Lesson[];
}

function getLessonIcon(lesson: Lesson) {
  if (lesson.videoUrl) return PlayCircle;
  return FileText;
}

export default function LessonList({ lessons }: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 italic py-4 text-center">
        Chưa có bài học nào.
      </p>
    );
  }

  const sorted = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <ol className="space-y-2">
      {sorted.map((lesson, index) => {
        const Icon = getLessonIcon(lesson);
        return (
          <li
            key={lesson.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
          >
            {/* Index badge */}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold mt-0.5">
              {index + 1}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                {lesson.title}
              </p>
              {lesson.content && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                  {lesson.content}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <Icon
                size={14}
                className={
                  lesson.videoUrl
                    ? "text-blue-500"
                    : "text-emerald-500"
                }
              />
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {lesson.videoUrl ? "Video" : "Tài liệu"}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
