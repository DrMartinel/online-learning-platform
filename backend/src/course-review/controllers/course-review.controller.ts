import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { CourseReviewService } from '../services/course-review.service';
import { CreateReviewDTO, ReviewResponseDTO } from '../dto/course-review.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('courses/:courseId/reviews')
export class CourseReviewController {
  constructor(private readonly reviewService: CourseReviewService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Submit a course review' })
  @ApiResponse({ status: 201, type: ReviewResponseDTO })
  async createReview(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDTO,
  ): Promise<ReviewResponseDTO> {
    return this.reviewService.create(user.id, courseId, dto);
  }

  @Get('my-review')
  @Auth()
  @ApiOperation({ summary: 'Get current user\'s review for this course' })
  @ApiResponse({ status: 200, type: ReviewResponseDTO })
  async getMyReview(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  ): Promise<ReviewResponseDTO | null> {
    return this.reviewService.findMyReview(user.id, courseId);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Get approved reviews for a course' })
  @ApiResponse({ status: 200, type: [ReviewResponseDTO] })
  async getApprovedReviews(
    @Param('courseId') courseId: string,
  ): Promise<ReviewResponseDTO[]> {
    return this.reviewService.findApprovedByCourse(courseId);
  }
}
