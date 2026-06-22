import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ICourseReviewRepository } from '../repositories/ICourseReviewRepository';
import { CourseService } from '../../course/services/course.service';
import { CourseReview } from '../entities/CourseReview';
import {
  CreateReviewDTO,
  AdminUpdateReviewStatusDTO,
  AdminRespondReviewDTO,
  ReviewResponseDTO,
} from '../dto/course-review.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CourseReviewService {
  constructor(
    @Inject('ICourseReviewRepository')
    private readonly reviewRepo: ICourseReviewRepository,
    private readonly courseService: CourseService,
  ) {}

  private capitalizeWords(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private mapToResponse(row: any): ReviewResponseDTO {
    const rawReview = row instanceof CourseReview ? row : null;
    
    return {
      id: rawReview ? rawReview.id : row.id,
      userId: rawReview ? rawReview.userId : row.user_id,
      courseId: rawReview ? rawReview.courseId : row.course_id,
      rating: rawReview ? rawReview.rating : Number(row.rating),
      comment: rawReview ? rawReview.comment : (row.comment || null),
      status: rawReview ? rawReview.status : row.status,
      response: rawReview ? rawReview.response : (row.response || null),
      respondedAt: rawReview ? rawReview.respondedAt : (row.responded_at ? new Date(row.responded_at) : null),
      createdAt: rawReview ? rawReview.createdAt : new Date(row.created_at),
      updatedAt: rawReview ? rawReview.updatedAt : new Date(row.updated_at),
      userFullName: row.profiles?.full_name ? this.capitalizeWords(row.profiles.full_name) : undefined,
      userAvatarUrl: row.profiles?.avatar_url || undefined,
      courseTitle: row.courses?.title || undefined,
    };
  }

  async create(userId: string, courseId: string, dto: CreateReviewDTO): Promise<ReviewResponseDTO> {
    // 1. Check if user is enrolled
    const isEnrolled = await this.courseService.checkEnrollment(courseId, userId);
    if (!isEnrolled) {
      throw new BadRequestException('Bạn phải sở hữu khóa học mới được đánh giá.');
    }

    // 2. Check if user already reviewed this course
    const existing = await this.reviewRepo.findByUserAndCourse(userId, courseId);
    if (existing) {
      throw new BadRequestException('Bạn đã đánh giá khóa học này rồi.');
    }

    const review = new CourseReview(
      randomUUID(),
      userId,
      courseId,
      dto.rating,
      dto.comment || null,
      'pending', // Starts as pending moderation
      null,
      null,
      new Date(),
      new Date(),
    );

    const saved = await this.reviewRepo.create(review);
    return this.mapToResponse(saved);
  }

  async findMyReview(userId: string, courseId: string): Promise<ReviewResponseDTO | null> {
    const review = await this.reviewRepo.findByUserAndCourse(userId, courseId);
    if (!review) return null;
    return this.mapToResponse(review);
  }

  async findApprovedByCourse(courseId: string): Promise<ReviewResponseDTO[]> {
    const reviews = await this.reviewRepo.findApprovedByCourse(courseId);
    return reviews.map(r => this.mapToResponse(r));
  }

  async findAllAdmin(filters: { courseId?: string; rating?: number; status?: string }): Promise<ReviewResponseDTO[]> {
    const reviews = await this.reviewRepo.findAllAdmin(filters);
    return reviews.map(r => this.mapToResponse(r));
  }

  async adminUpdateStatus(id: string, dto: AdminUpdateReviewStatusDTO): Promise<ReviewResponseDTO> {
    const review = await this.reviewRepo.findById(id);
    if (!review) {
      throw new NotFoundException(`Không tìm thấy đánh giá với ID: ${id}`);
    }

    review.status = dto.status;
    review.updatedAt = new Date();

    const updated = await this.reviewRepo.update(review);
    return this.mapToResponse(updated);
  }

  async adminRespond(id: string, dto: AdminRespondReviewDTO): Promise<ReviewResponseDTO> {
    const review = await this.reviewRepo.findById(id);
    if (!review) {
      throw new NotFoundException(`Không tìm thấy đánh giá với ID: ${id}`);
    }

    review.response = dto.response;
    review.respondedAt = new Date();
    review.updatedAt = new Date();

    const updated = await this.reviewRepo.update(review);
    return this.mapToResponse(updated);
  }

  async adminDelete(id: string): Promise<void> {
    const review = await this.reviewRepo.findById(id);
    if (!review) {
      throw new NotFoundException(`Không tìm thấy đánh giá với ID: ${id}`);
    }
    await this.reviewRepo.delete(id);
  }
}
