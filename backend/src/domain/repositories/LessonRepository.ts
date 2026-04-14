import { Lesson } from '../entities/Lesson';

export interface LessonRepository {
  create(lesson: Omit<Lesson, 'id' | 'createdAt'>): Promise<Lesson>;
  findById(id: string): Promise<Lesson | null>;
  findByCourseId(courseId: string): Promise<Lesson[]>;
  update(id: string, lesson: Partial<Omit<Lesson, 'id' | 'courseId' | 'createdAt'>>): Promise<Lesson | null>;
  delete(id: string): Promise<void>;
}
