import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import {
  CreateQuestionDTO,
  UpdateQuestionDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
  QuestionResponseDTO,
  VariantResponseDTO,
  ListQuestionsFilterDTO,
} from '../dto/question.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';

@ApiTags('questions')
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @Auth('action:question:create')
  @ApiOperation({ summary: 'Create a new question with variants' })
  @ApiResponse({ status: 201, description: 'Question created', type: QuestionResponseDTO })
  async createQuestion(@Body() dto: CreateQuestionDTO): Promise<QuestionResponseDTO> {
    return this.questionService.create(dto);
  }

  @Get()
  @Auth('action:question:list')
  @ApiOperation({ summary: 'List questions with optional filters' })
  @ApiQuery({ name: 'type', required: false, enum: ['essay', 'single_choice', 'multiple_choice'] })
  @ApiQuery({ name: 'tag', required: false })
  @ApiResponse({ status: 200, description: 'List of questions', type: [QuestionResponseDTO] })
  async listQuestions(@Query() filter: ListQuestionsFilterDTO): Promise<QuestionResponseDTO[]> {
    return this.questionService.list(filter);
  }

  @Get(':id')
  @Auth('action:question:read')
  @ApiOperation({ summary: 'Get question by ID with all variants' })
  @ApiResponse({ status: 200, description: 'The question', type: QuestionResponseDTO })
  async getQuestion(@Param('id') id: string): Promise<QuestionResponseDTO> {
    return this.questionService.findById(id);
  }

  @Put(':id')
  @Auth('action:question:update')
  @ApiOperation({ summary: 'Update question metadata (type, tags)' })
  @ApiResponse({ status: 200, description: 'Question updated', type: QuestionResponseDTO })
  async updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDTO): Promise<QuestionResponseDTO> {
    return this.questionService.update(id, dto);
  }

  @Delete(':id')
  @Auth('action:question:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a question and all its variants' })
  @ApiResponse({ status: 204, description: 'Question deleted' })
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    return this.questionService.delete(id);
  }

  // --- Variant endpoints ---

  @Post(':id/variants')
  @Auth('action:question:update')
  @ApiOperation({ summary: 'Add a new variant to a question' })
  @ApiResponse({ status: 201, description: 'Variant created', type: VariantResponseDTO })
  async addVariant(@Param('id') questionId: string, @Body() dto: CreateVariantDTO): Promise<VariantResponseDTO> {
    return this.questionService.addVariant(questionId, dto);
  }

  @Put(':id/variants/:variantId')
  @Auth('action:question:update')
  @ApiOperation({ summary: 'Update a variant' })
  @ApiResponse({ status: 200, description: 'Variant updated', type: VariantResponseDTO })
  async updateVariant(
    @Param('id') questionId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDTO,
  ): Promise<VariantResponseDTO> {
    return this.questionService.updateVariant(questionId, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  @Auth('action:question:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a variant' })
  @ApiResponse({ status: 204, description: 'Variant deleted' })
  async deleteVariant(
    @Param('id') questionId: string,
    @Param('variantId') variantId: string,
  ): Promise<void> {
    return this.questionService.deleteVariant(questionId, variantId);
  }
}
