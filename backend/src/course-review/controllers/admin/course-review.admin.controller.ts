import { Controller, Get, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CourseReviewService } from '../../services/course-review.service';
import {
  ReviewResponseDTO,
  ListReviewsFilterDTO,
  AdminUpdateReviewStatusDTO,
  AdminRespondReviewDTO,
} from '../../dto/course-review.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../../../iam/decorators/auth.decorator';

@ApiTags('admin/reviews')
@ApiBearerAuth()
@Controller('admin/reviews')
export class CourseReviewAdminController {
  constructor(private readonly reviewService: CourseReviewService) {}

  @Get()
  @Auth('action:admin:review:manage')
  @ApiOperation({ summary: 'Admin: List all course reviews with filters' })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'rating', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'hidden'] })
  @ApiResponse({ status: 200, type: [ReviewResponseDTO] })
  async listReviews(@Query() filter: ListReviewsFilterDTO): Promise<ReviewResponseDTO[]> {
    return this.reviewService.findAllAdmin(filter);
  }

  @Patch(':id/status')
  @Auth('action:admin:review:manage')
  @ApiOperation({ summary: 'Admin: Moderate review status (approve/hide)' })
  @ApiResponse({ status: 200, type: ReviewResponseDTO })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateReviewStatusDTO,
  ): Promise<ReviewResponseDTO> {
    return this.reviewService.adminUpdateStatus(id, dto);
  }

  @Patch(':id/response')
  @Auth('action:admin:review:manage')
  @ApiOperation({ summary: 'Admin/Instructor: Respond to review comment' })
  @ApiResponse({ status: 200, type: ReviewResponseDTO })
  async respondToReview(
    @Param('id') id: string,
    @Body() dto: AdminRespondReviewDTO,
  ): Promise<ReviewResponseDTO> {
    return this.reviewService.adminRespond(id, dto);
  }

  @Delete(':id')
  @Auth('action:admin:review:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: Delete review (spam/abuse)' })
  @ApiResponse({ status: 204 })
  async deleteReview(@Param('id') id: string): Promise<void> {
    return this.reviewService.adminDelete(id);
  }
}
