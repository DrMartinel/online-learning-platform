import { Test, TestingModule } from '@nestjs/testing';
import { ExamService } from '../services/exam.service';
import { Exam } from '../entities/Exam';
import { ExamQuestion } from '../entities/ExamQuestion';
import { ExamNotFoundError, ExamQuestionNotFoundError } from '../ExamErrors';

describe('ExamService', () => {
  let service: ExamService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamService,
        {
          provide: 'IExamRepository',
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            addQuestion: jest.fn(),
            findQuestionsByExamId: jest.fn(),
            findExamQuestionById: jest.fn(),
            updateExamQuestion: jest.fn(),
            removeQuestion: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExamService>(ExamService);
    repo = module.get('IExamRepository');
  });

  describe('create', () => {
    it('should create an exam optionally with questions', async () => {
      repo.create.mockImplementation(async (e: Exam) => e);
      repo.addQuestion.mockImplementation(async (eq: ExamQuestion) => eq);

      const result = await service.create('user-123', {
        title: 'Midterm Exam',
        courseId: 'course-123',
        headerContent: 'Welcome to the exam',
        questionLabel: 'Câu',
        tags: [],
        accessRights: 'private',
        questions: [
          { questionId: 'q-1', orderIndex: 0, points: 5 },
        ],
      });

      expect(result.title).toBe('Midterm Exam');
      expect(result.courseId).toBe('course-123');
      expect(result.createdBy).toBe('user-123');
      expect(result.questions.length).toBe(1);
      expect(result.questions[0].questionId).toBe('q-1');
    });
  });

  describe('findById', () => {
    it('should return exam with questions', async () => {
      const exam = new Exam('exam-123', 'course-123', 'user-123', 'Midterm', null, new Date(), 'Câu', [], 'private');
      const eq = new ExamQuestion('eq-123', 'exam-123', 'q-123', 0, 2);
      repo.findById.mockResolvedValue(exam);
      repo.findQuestionsByExamId.mockResolvedValue([eq]);

      const result = await service.findById('exam-123');
      expect(result.id).toBe('exam-123');
      expect(result.questions.length).toBe(1);
      expect(result.questions[0].points).toBe(2);
    });

    it('should throw ExamNotFoundError if exam does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('exam-999')).rejects.toThrow(ExamNotFoundError);
    });
  });

  describe('list', () => {
    it('should list exams with their questions', async () => {
      const exam = new Exam('exam-123', 'course-123', 'user-123', 'Midterm', null, new Date(), 'Câu', [], 'private');
      repo.findAll.mockResolvedValue([exam]);
      repo.findQuestionsByExamId.mockResolvedValue([]);

      const result = await service.list({});
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('exam-123');
    });
  });

  describe('update', () => {
    it('should update exam metadata', async () => {
      const exam = new Exam('exam-123', 'course-123', 'user-123', 'Midterm', null, new Date(), 'Câu', [], 'private');
      repo.findById.mockResolvedValue(exam);
      repo.update.mockImplementation(async (updated: Exam) => updated);
      repo.findQuestionsByExamId.mockResolvedValue([]);

      const result = await service.update('exam-123', { title: 'Final Exam', headerContent: 'New header' });
      expect(result.title).toBe('Final Exam');
      expect(result.headerContent).toBe('New header');
    });

    it('should throw ExamNotFoundError if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('exam-999', { title: 'New title' })).rejects.toThrow(ExamNotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete an exam', async () => {
      const exam = new Exam('exam-123', 'course-123', 'user-123', 'Midterm', null, new Date(), 'Câu', [], 'private');
      repo.findById.mockResolvedValue(exam);
      repo.delete.mockResolvedValue(undefined);

      await expect(service.delete('exam-123')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('exam-123');
    });

    it('should throw ExamNotFoundError if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.delete('exam-999')).rejects.toThrow(ExamNotFoundError);
    });
  });

  describe('exam question links', () => {
    it('should add a question link to an exam', async () => {
      const exam = new Exam('exam-123', 'course-123', 'user-123', 'Midterm', null, new Date(), 'Câu', [], 'private');
      repo.findById.mockResolvedValue(exam);
      repo.addQuestion.mockImplementation(async (eq: ExamQuestion) => eq);

      const result = await service.addQuestion('exam-123', { questionId: 'q-456', orderIndex: 2, points: 3 });
      expect(result.questionId).toBe('q-456');
      expect(result.points).toBe(3);
    });

    it('should update a question link', async () => {
      const exam = new Exam('exam-123', 'course-123', 'user-123', 'Midterm', null, new Date(), 'Câu', [], 'private');
      const eq = new ExamQuestion('eq-123', 'exam-123', 'q-123', 0, 2);
      repo.findById.mockResolvedValue(exam);
      repo.findExamQuestionById.mockResolvedValue(eq);
      repo.updateExamQuestion.mockImplementation(async (updated: ExamQuestion) => updated);

      const result = await service.updateExamQuestion('exam-123', 'eq-123', { orderIndex: 5, points: 10 });
      expect(result.orderIndex).toBe(5);
      expect(result.points).toBe(10);
    });

    it('should remove a question link from an exam', async () => {
      const exam = new Exam('exam-123', 'course-123', 'user-123', 'Midterm', null, new Date(), 'Câu', [], 'private');
      const eq = new ExamQuestion('eq-123', 'exam-123', 'q-123', 0, 2);
      repo.findById.mockResolvedValue(exam);
      repo.findExamQuestionById.mockResolvedValue(eq);
      repo.removeQuestion.mockResolvedValue(undefined);

      await expect(service.removeQuestion('exam-123', 'eq-123')).resolves.toBeUndefined();
      expect(repo.removeQuestion).toHaveBeenCalledWith('eq-123');
    });
  });
});
