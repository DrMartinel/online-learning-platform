export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string | null;
  content: string | null;
  orderIndex: number;
  createdAt: string;
}
