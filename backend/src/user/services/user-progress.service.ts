import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
      lastPosition: 0,
    });
    return progress as unknown as UserProgressResponseDTO;
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<UserProgressResponseDTO | null> {
    const progress = await this.progressRepo.findByLesson(userId, lessonId);
    return progress ? progress as unknown as UserProgressResponseDTO : null;
  }

  async getCourseProgress(userId: string, courseId: string): Promise<CourseProgressResponseDTO> {
    const progressList = await this.progressRepo.findByCourse(userId, courseId);
    
    // Naive implementation assuming total lessons is known or passed, here we just return progress based on entries.
    // In a real app we would query the course/lessons table for the true total.
    const totalLessons = progressList.length; // Placeholder
    const completedLessons = progressList.filter(p => p.isCompleted).length;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      courseId,
      totalLessons,
      completedLessons,
      progressPercentage,
    };
  }

  async updateProgress(userId: string, lessonId: string, dto: UpdateUserProgressDTO): Promise<UserProgressResponseDTO> {
    const existing = await this.progressRepo.findByLesson(userId, lessonId);
    if (!existing) throw new NotFoundException('Progress not found');

    const progress = await this.progressRepo.createOrUpdate({
      userId,
      courseId: existing.courseId,
      lessonId,
      isCompleted: dto.isCompleted !== undefined ? dto.isCompleted : existing.isCompleted,
      lastPosition: dto.lastPosition !== undefined ? dto.lastPosition : existing.lastPosition,
    });
    return progress as unknown as UserProgressResponseDTO;
  }
}
