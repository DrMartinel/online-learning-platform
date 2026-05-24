import { PlayCircle, FileText, Pencil } from "lucide-react";
import Link from "next/link";
import DeleteLessonButton from "./DeleteLessonButton";


export interface Lesson {
  id: string;
  courseId: string;
  chapterId?: string | null;
  title: string;
  videoUrl?: string | null;
  content?: string | null;
  orderIndex: number;
  createdAt: string;
  media?: any[];
}

interface LessonListProps {
  lessons: Lesson[];
  isInstructor?: boolean;
  courseId?: string;
}

function getLessonIcon(lesson: Lesson) {
  if (lesson.videoUrl) return PlayCircle;
  return FileText;
}

export default function LessonList({ lessons, isInstructor = false, courseId }: LessonListProps) {
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
          <li key={lesson.id}>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
              <Link
                href={`/learn/${lesson.courseId}/${lesson.id}`}
                className="flex items-start gap-3 flex-1 min-w-0"
              >
                {/* Index badge */}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 text-primary group-hover:bg-primary/20 dark:group-hover:bg-primary/30 text-xs font-bold mt-0.5 transition-colors">
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
              </Link>

              {/* Edit & Delete buttons for instructor */}
              {isInstructor && courseId && (
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/courses/${courseId}/lessons/${lesson.id}/edit`}
                    className="shrink-0 p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Sửa bài học"
                  >
                    <Pencil size={14} />
                  </Link>
                  <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.title} />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
