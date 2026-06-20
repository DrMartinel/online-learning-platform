import { Chapter } from '../entities/Chapter';

export interface IChapterRepository {
  create(chapter: Chapter): Promise<Chapter>;
  findById(id: string): Promise<Chapter | null>;
  findByCourseId(courseId: string): Promise<Chapter[]>;
  update(chapter: Chapter): Promise<Chapter>;
  delete(id: string): Promise<void>;
}
