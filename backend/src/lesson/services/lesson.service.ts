import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LessonRepository } from '../repositories/Ilesson.repository';
import { Lesson } from '../entities/Lesson';
import { CreateLessonDTO, UpdateLessonDTO, LessonResponseDTO } from '../dto/lesson.dto';
import { randomUUID } from 'crypto';
import { CourseService } from '../../course/services/course.service'; 
import { SupabaseClient } from '@supabase/supabase-js';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@Injectable()
export class LessonService {
  constructor(
    @Inject('ILessonRepository')
    private readonly lessonRepo: LessonRepository,
    private readonly courseService: CourseService,
    private readonly supabase: SupabaseClient
  ) {}

  async create(dto: CreateLessonDTO): Promise<LessonResponseDTO> {
    const lesson = await this.lessonRepo.create({
      courseId: dto.courseId,
      title: dto.title,
      content: dto.content || null,
      videoUrl: dto.videoUrl || null,
      orderIndex: dto.orderIndex,
    });
    return this.mapToResponse(lesson);
  }

  async findById(id: string): Promise<LessonResponseDTO> {
    const lesson = await this.lessonRepo.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.mapToResponse(lesson);
  }

  async findByCourseId(courseId: string, publishedOnly?: boolean): Promise<LessonResponseDTO[]> {
    const lessons = await this.lessonRepo.findByCourseId(courseId);
    // Ignore publishedOnly for now since Lesson doesn't have it
    return lessons.map((l) => this.mapToResponse(l));
  }

  async update(id: string, dto: UpdateLessonDTO): Promise<LessonResponseDTO> {
    const lesson = await this.lessonRepo.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const updated = await this.lessonRepo.update(id, {
      title: dto.title !== undefined ? dto.title : lesson.title,
      content: dto.content !== undefined ? dto.content : lesson.content,
      videoUrl: dto.videoUrl !== undefined ? dto.videoUrl : lesson.videoUrl,
      orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : lesson.orderIndex,
    });
    
    if (!updated) throw new NotFoundException('Lesson not found');
    return this.mapToResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const lesson = await this.lessonRepo.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonRepo.delete(id);
  }

  async getLessonDetail(id: string, userId: string): Promise<LessonResponseDTO> {
    // 1. Lấy thông tin bài học cơ bản
    const lesson = await this.lessonRepo.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const response = this.mapToResponse(lesson);
    let isLocked = false;

    // 2. Lấy thông tin khóa học để kiểm tra giá tiền
    const course = await this.courseService.findById(lesson.courseId);

    // 3. LOGIC PAYWALL: Nếu khóa học có giá > 0 (Phải trả phí)
    if (course && course.price > 0) {
      const isInstructor = course.instructorId === userId;
      
      // Nếu không phải là giảng viên thì phải kiểm tra xem đã mua chưa
      if (!isInstructor) {
        // Query bảng enrollments xem user này đã sở hữu khóa học chưa
        const { data: enrollment, error } = await this.supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', course.id)
          .maybeSingle(); // Dùng maybeSingle để tránh báo lỗi 500 nếu ko tìm thấy

        // 4. Nếu lỗi hoặc chưa ghi danh -> Khóa bài học
        if (error || !enrollment) {
          isLocked = true;
        }
      }
    }

    // 5. Nếu bài học bị khóa, XÓA sạch URL Video và Nội dung trước khi gửi về cho Client
    if (isLocked) {
      response.videoUrl = undefined;
      response.content = undefined;
      // Trả cờ isLocked = true để Frontend vẽ ổ khóa
      (response as any).isLocked = true; 
    } else {
      (response as any).isLocked = false;
    }

    return response;
  }

  private mapToResponse(lesson: Lesson): LessonResponseDTO {
    return {
      id: lesson.id,
      courseId: lesson.courseId,
      title: lesson.title,
      content: lesson.content || undefined,
      videoUrl: lesson.videoUrl || undefined,
      orderIndex: lesson.orderIndex,
      isPublished: true, // Placeholder since DB doesn't have it
      createdAt: new Date(lesson.createdAt),
    };
  }
}
