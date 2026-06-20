import { Inject, Injectable } from '@nestjs/common';
import { IUserProgressRepository } from '../repositories/IUserProgressRepository';
import { CreateUserProgressDTO, UpdateUserProgressDTO, UserProgressResponseDTO, CourseProgressResponseDTO } from '../dto/user-progress.dto';

@Injectable()
export class UserProgressService {
  constructor(
    @Inject('IUserProgressRepository')
    private readonly progressRepo: IUserProgressRepository,
  ) {}

  async createProgress(userId: string, dto: CreateUserProgressDTO): Promise<UserProgressResponseDTO> {
    const progress = await this.progressRepo.createOrUpdate({
      userId,
      courseId: dto.courseId,
      lessonId: dto.lessonId,
      isCompleted: false,
    });
    return progress as unknown as UserProgressResponseDTO;
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<UserProgressResponseDTO | null> {
    const progress = await this.progressRepo.findByLesson(userId, lessonId);
    return progress ? progress as unknown as UserProgressResponseDTO : null;
  }

  async getCourseProgress(userId: string, courseId: string): Promise<CourseProgressResponseDTO> {
    const [progressList, totalLessonsCount] = await Promise.all([
      this.progressRepo.findByCourse(userId, courseId),
      this.progressRepo.countCourseLessons(courseId),
    ]);

    const completedLessonsCount = progressList.filter(p => p.isCompleted).length;
    const percentage = totalLessonsCount > 0
      ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
      : 0;

    const progress = progressList.map(p => ({
      lessonId: p.lessonId,
      completed: p.isCompleted,
    }));

    return {
      completedLessonsCount,
      totalLessonsCount,
      percentage,
      progress,
    };
  }

  async updateProgress(userId: string, lessonId: string, dto: UpdateUserProgressDTO): Promise<UserProgressResponseDTO> {
    // Use upsert — create the record if it doesn't exist yet.
    // We need the courseId for the upsert; fetch it from the existing record if present.
    const existing = await this.progressRepo.findByLesson(userId, lessonId);

    const progress = await this.progressRepo.createOrUpdate({
      userId,
      courseId: existing?.courseId,
      lessonId,
      isCompleted: dto.isCompleted !== undefined ? dto.isCompleted : (existing?.isCompleted ?? false),
    });
    return progress as unknown as UserProgressResponseDTO;
  }
}
