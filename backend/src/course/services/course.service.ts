import { Inject, Injectable } from '@nestjs/common';
import { ICourseRepository } from '../repositories/ICourseRepository';
import { CourseError } from '../CourseErrors';
import { Course } from '../entities/Course';
import {
  CreateCourseDTO,
  UpdateCourseDTO,
  CourseResponseDTO,
  ListCoursesFilterDTO,
} from '../dto/course.dto';
import { AdminCreateCourseDTO, AdminUpdateCourseDTO } from '../dto/course-admin.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CourseService {
  constructor(
    @Inject('ICourseRepository')
    private readonly courseRepo: ICourseRepository,
  ) {}

  async create(instructorId: string, dto: CreateCourseDTO): Promise<CourseResponseDTO> {
    const course = new Course(
      randomUUID(),
      instructorId,
      dto.title,
      dto.description || null,
      dto.thumbnailUrl || null,
      false,
      new Date(),
      dto.price ?? 0, // <--- BỔ SUNG: Truyền giá tiền vào khởi tạo (mặc định 0đ)
    );
    await this.courseRepo.create(course);
    return this.mapToResponse(course);
  }

  async findById(id: string): Promise<CourseResponseDTO> {
    const course = await this.courseRepo.findById(id);
    if (!course) {
      throw new CourseError(`Course not found: ${id}`);
    }
    return this.mapToResponse(course);
  }

  async list(filter: ListCoursesFilterDTO): Promise<CourseResponseDTO[]> {
    const courses = await this.courseRepo.findAll({
      instructorId: filter.instructorId,
      published: filter.published,
    });
    return courses.map((c) => this.mapToResponse(c));
  }

  async update(id: string, dto: UpdateCourseDTO, instructorId: string): Promise<CourseResponseDTO> {
    const course = await this.courseRepo.findById(id);
    if (!course) {
      throw new CourseError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new CourseError('You do not have permission to update this course');
    }
    if (dto.title) course.title = dto.title;
    if (dto.description !== undefined) course.description = dto.description || null;
    if (dto.thumbnailUrl !== undefined) course.thumbnailUrl = dto.thumbnailUrl || null;
    if (dto.price !== undefined) course.price = dto.price; // <--- BỔ SUNG: Cho phép update giá
    
    if (dto.isPublished !== undefined) {
      if (dto.isPublished && !course.isPublished) {
        course.publish();
      } else if (!dto.isPublished && course.isPublished) {
        course.unpublish();
      }
    }
    await this.courseRepo.update(course);
    return this.mapToResponse(course);
  }

  async delete(id: string, instructorId: string): Promise<void> {
    const course = await this.courseRepo.findById(id);
    if (!course) {
      throw new CourseError('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new CourseError('You do not have permission to delete this course');
    }
    await this.courseRepo.delete(id);
  }

  // --- Admin Methods ---

  async adminCreate(dto: AdminCreateCourseDTO): Promise<CourseResponseDTO> {
    const course = new Course(
      randomUUID(),
      dto.instructorId,
      dto.title,
      dto.description || null,
      dto.thumbnailUrl || null,
      false,
      new Date(),
      dto.price ?? 0, // <--- BỔ SUNG
    );
    await this.courseRepo.create(course);
    return this.mapToResponse(course);
  }

  async adminUpdate(id: string, dto: AdminUpdateCourseDTO): Promise<CourseResponseDTO> {
    const course = await this.courseRepo.findById(id);
    if (!course) {
      throw new CourseError('Course not found');
    }
    if (dto.title) course.title = dto.title;
    if (dto.description !== undefined) course.description = dto.description || null;
    if (dto.thumbnailUrl !== undefined) course.thumbnailUrl = dto.thumbnailUrl || null;
    if (dto.instructorId) course.instructorId = dto.instructorId;
    if (dto.price !== undefined) course.price = dto.price; // <--- BỔ SUNG
    
    if (dto.isPublished !== undefined) {
      if (dto.isPublished && !course.isPublished) {
        course.publish();
      } else if (!dto.isPublished && course.isPublished) {
        course.unpublish();
      }
    }
    await this.courseRepo.update(course);
    return this.mapToResponse(course);
  }

  async adminDelete(id: string): Promise<void> {
    const course = await this.courseRepo.findById(id);
    if (!course) {
      throw new CourseError('Course not found');
    }
    await this.courseRepo.delete(id);
  }

  private mapToResponse(course: Course): CourseResponseDTO {
    return {
      id: course.id,
      instructorId: course.instructorId,
      title: course.title,
      description: course.description || undefined,
      thumbnailUrl: course.thumbnailUrl || undefined,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      price: course.price, // <--- BỔ SUNG DÒNG NÀY ĐỂ FIX LỖI
    };
  }
}