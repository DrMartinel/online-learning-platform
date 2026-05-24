export interface Lesson {
  id: string;
  courseId: string;
  chapterId?: string | null;
  title: string;
  videoUrl: string | null;
  content: string | null;
  orderIndex: number;
  createdAt: string;
  media?: any[];
}
