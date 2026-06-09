import { ExamSession } from '../entities/ExamSession';
import { ExamAttempt } from '../entities/ExamAttempt';

export interface IExamSessionRepository {
  // --- ExamSession CRUD ---
  create(examSession: ExamSession): Promise<ExamSession>;
  findById(id: string): Promise<ExamSession | null>;
  findAll(): Promise<ExamSession[]>;
  findByCourseId(courseId: string): Promise<ExamSession[]>;
  findActiveSessions(): Promise<ExamSession[]>;
  update(examSession: ExamSession): Promise<ExamSession>;
  delete(id: string): Promise<void>;

  // --- ExamAttempt CRUD ---
  createAttempt(attempt: ExamAttempt): Promise<ExamAttempt>;
  findAttemptById(id: string): Promise<ExamAttempt | null>;
  findAttemptByUserAndSession(userId: string, sessionId: string): Promise<ExamAttempt | null>;
  findAttemptsBySessionId(sessionId: string): Promise<ExamAttempt[]>;
  updateAttempt(attempt: ExamAttempt): Promise<ExamAttempt>;
}
