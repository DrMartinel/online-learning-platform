import { Test, TestingModule } from '@nestjs/testing';
import { QuestionService } from '../services/question.service';
import { Question } from '../entities/Question';
import { QuestionVariant } from '../entities/QuestionVariant';
import { QuestionNotFoundError, QuestionVariantNotFoundError } from '../QuestionErrors';

describe('QuestionService', () => {
  let service: QuestionService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionService,
        {
          provide: 'IQuestionRepository',
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createVariant: jest.fn(),
            findVariantsByQuestionId: jest.fn(),
            findVariantById: jest.fn(),
            updateVariant: jest.fn(),
            deleteVariant: jest.fn(),
            getNextVariantIndex: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuestionService>(QuestionService);
    repo = module.get('IQuestionRepository');
  });

  describe('create', () => {
    it('should create a question with variants', async () => {
      repo.create.mockImplementation(async (q: Question) => q);
      repo.createVariant.mockImplementation(async (v: QuestionVariant) => v);

      const result = await service.create({
        type: 'single_choice',
        tags: ['math', 'algebra'],
        variants: [
          {
            content: 'What is 1 + 1?',
            options: [
              { label: 'A', text: '1' },
              { label: 'B', text: '2' },
            ],
            correctAnswer: { index: 1 },
            explanation: 'Simple math',
          },
        ],
      });

      expect(result.type).toBe('single_choice');
      expect(result.tags).toContain('math');
      expect(result.variants.length).toBe(1);
      expect(result.variants[0].content).toBe('What is 1 + 1?');
      expect(result.variants[0].variantIndex).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return question with its variants', async () => {
      const q = new Question('q-123', 'essay', ['tag1'], new Date());
      const v = new QuestionVariant('v-123', 'q-123', 0, 'Describe photosynthesis', null, null, null, new Date());
      repo.findById.mockResolvedValue(q);
      repo.findVariantsByQuestionId.mockResolvedValue([v]);

      const result = await service.findById('q-123');
      expect(result.id).toBe('q-123');
      expect(result.variants.length).toBe(1);
      expect(result.variants[0].content).toBe('Describe photosynthesis');
    });

    it('should throw QuestionNotFoundError if question does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('q-999')).rejects.toThrow(QuestionNotFoundError);
    });
  });

  describe('list', () => {
    it('should list questions with variants', async () => {
      const q = new Question('q-123', 'essay', ['tag1'], new Date());
      const v = new QuestionVariant('v-123', 'q-123', 0, 'Content', null, null, null, new Date());
      repo.findAll.mockResolvedValue([q]);
      repo.findVariantsByQuestionId.mockResolvedValue([v]);

      const result = await service.list({});
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('q-123');
      expect(result[0].variants.length).toBe(1);
    });
  });

  describe('update', () => {
    it('should update question metadata', async () => {
      const q = new Question('q-123', 'essay', ['tag1'], new Date());
      repo.findById.mockResolvedValue(q);
      repo.update.mockImplementation(async (updated: Question) => updated);
      repo.findVariantsByQuestionId.mockResolvedValue([]);

      const result = await service.update('q-123', { type: 'multiple_choice', tags: ['tag2'] });
      expect(result.type).toBe('multiple_choice');
      expect(result.tags).toContain('tag2');
    });

    it('should throw QuestionNotFoundError if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('q-999', { type: 'essay' })).rejects.toThrow(QuestionNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete a question', async () => {
      const q = new Question('q-123', 'essay', [], new Date());
      repo.findById.mockResolvedValue(q);
      repo.delete.mockResolvedValue(undefined);

      await expect(service.delete('q-123')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('q-123');
    });

    it('should throw QuestionNotFoundError if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.delete('q-999')).rejects.toThrow(QuestionNotFoundError);
    });
  });

  describe('variant operations', () => {
    it('should add a variant to a question', async () => {
      const q = new Question('q-123', 'essay', [], new Date());
      repo.findById.mockResolvedValue(q);
      repo.getNextVariantIndex.mockResolvedValue(1);
      repo.createVariant.mockImplementation(async (v: QuestionVariant) => v);

      const result = await service.addVariant('q-123', { content: 'Variant 2' });
      expect(result.variantIndex).toBe(1);
      expect(result.content).toBe('Variant 2');
    });

    it('should update a variant', async () => {
      const q = new Question('q-123', 'essay', [], new Date());
      const v = new QuestionVariant('v-123', 'q-123', 0, 'Original content', null, null, null, new Date());
      repo.findById.mockResolvedValue(q);
      repo.findVariantById.mockResolvedValue(v);
      repo.updateVariant.mockImplementation(async (updated: QuestionVariant) => updated);

      const result = await service.updateVariant('q-123', 'v-123', { content: 'Updated content' });
      expect(result.content).toBe('Updated content');
    });

    it('should delete a variant', async () => {
      const q = new Question('q-123', 'essay', [], new Date());
      const v = new QuestionVariant('v-123', 'q-123', 0, 'Original content', null, null, null, new Date());
      repo.findById.mockResolvedValue(q);
      repo.findVariantById.mockResolvedValue(v);
      repo.deleteVariant.mockResolvedValue(undefined);

      await expect(service.deleteVariant('q-123', 'v-123')).resolves.toBeUndefined();
      expect(repo.deleteVariant).toHaveBeenCalledWith('v-123');
    });
  });
});
