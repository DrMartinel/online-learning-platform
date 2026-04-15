import { CourseProgressDTO } from '../../dtos/UserProgressDTOs';
import { IUserProgressRepository } from '../../../domain/repositories/IUserProgressRepository';

export class GetCourseProgressUseCase {
  constructor(private readonly repository: IUserProgressRepository) {}

  async execute(userId: string, courseId: string): Promise<CourseProgressDTO> {
    const progress = await this.repository.findByUserAndCourse(userId, courseId);
    const completedLessonsCount = await this.repository.countCompletedLessonsInCourse(userId, courseId);
    const totalLessonsCount = await this.repository.countTotalLessonsInCourse(courseId);
    
    const percentage = totalLessonsCount === 0 ? 0 : Math.round((completedLessonsCount / totalLessonsCount) * 100);

    return {
      courseId,
      progress,
      completedLessonsCount,
      totalLessonsCount,
      percentage,
    };
  }
}
