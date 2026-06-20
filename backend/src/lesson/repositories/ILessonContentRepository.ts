import { LessonContent } from '../entities/LessonContent';

export interface ILessonContentRepository {
  create(content: LessonContent): Promise<LessonContent>;
  findById(id: string): Promise<LessonContent | null>;
  findByLessonId(lessonId: string): Promise<LessonContent[]>;
  update(content: LessonContent): Promise<LessonContent>;
  delete(id: string): Promise<void>;
}
