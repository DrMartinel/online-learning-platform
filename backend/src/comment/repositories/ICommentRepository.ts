import { Comment } from '../entities/Comment';

export interface ICommentRepository {
  create(comment: Comment): Promise<Comment>;
  findById(id: string): Promise<Comment | null>;
  findByLessonId(lessonId: string): Promise<(Comment & { userFullName?: string; userAvatarUrl?: string })[]>;
  update(comment: Comment): Promise<Comment>;
  delete(id: string): Promise<void>;
}
