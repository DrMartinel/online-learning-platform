import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IExamSessionRepository } from '../repositories/IExamSessionRepository';
import { ExamSession } from '../entities/ExamSession';
import { ExamAttempt } from '../entities/ExamAttempt';
import { CreateExamSessionDTO, UpdateExamSessionDTO } from '../dto/exam-session.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ExamSessionService {
  constructor(
    @Inject('IExamSessionRepository')
    private readonly repository: IExamSessionRepository,
    private readonly supabaseClient: SupabaseClient,
  ) {}

  // --- Admin/Giáo viên: Quản lý đợt thi ---

  async createSession(dto: CreateExamSessionDTO, userId: string): Promise<ExamSession> {
    const session = new ExamSession(
      randomUUID(),
      dto.title,
      dto.examId,
      dto.courseId || null,
      new Date(dto.startTime),
      new Date(dto.endTime),
      dto.durationMinutes,
      dto.accessCode || null,
      dto.status || 'draft',
      userId,
      new Date(),
    );

    // Kiểm tra đề thi có tồn tại không
    const { data: exam, error: examError } = await this.supabaseClient
      .from('exams')
      .select('id')
      .eq('id', dto.examId)
      .maybeSingle();

    if (examError || !exam) {
      throw new NotFoundException('Không tìm thấy đề thi đã chọn.');
    }

    // Nếu thi trong khóa học, kiểm tra khóa học có tồn tại không
    if (dto.courseId) {
      const { data: course, error: courseError } = await this.supabaseClient
        .from('courses')
        .select('id')
        .eq('id', dto.courseId)
        .maybeSingle();

      if (courseError || !course) {
        throw new NotFoundException('Không tìm thấy khóa học đã chọn.');
      }
    }

    return this.repository.create(session);
  }

  async getSessionDetail(id: string): Promise<ExamSession> {
    const session = await this.repository.findById(id);
    if (!session) {
      throw new NotFoundException('Không tìm thấy đợt thi.');
    }
    return session;
  }

  async listSessions(courseId?: string): Promise<ExamSession[]> {
    if (courseId) {
      return this.repository.findByCourseId(courseId);
    }
    return this.repository.findAll();
  }

  async updateSession(id: string, dto: UpdateExamSessionDTO): Promise<ExamSession> {
    const session = await this.repository.findById(id);
    if (!session) {
      throw new NotFoundException('Không tìm thấy đợt thi.');
    }

    if (dto.title !== undefined) session.title = dto.title;
    if (dto.startTime !== undefined) session.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) session.endTime = new Date(dto.endTime);
    if (dto.durationMinutes !== undefined) session.durationMinutes = dto.durationMinutes;
    if (dto.accessCode !== undefined) session.accessCode = dto.accessCode;
    if (dto.status !== undefined) session.status = dto.status;
    if (dto.courseId !== undefined) session.courseId = dto.courseId;

    return this.repository.update(session);
  }

  async deleteSession(id: string): Promise<void> {
    const session = await this.repository.findById(id);
    if (!session) {
      throw new NotFoundException('Không tìm thấy đợt thi.');
    }
    return this.repository.delete(id);
  }

  async getSessionDashboard(id: string): Promise<any> {
    const session = await this.repository.findById(id);
    if (!session) {
      throw new NotFoundException('Không tìm thấy đợt thi.');
    }

    // Lấy thông tin đề thi
    const { data: exam } = await this.supabaseClient
      .from('exams')
      .select('title')
      .eq('id', session.examId)
      .maybeSingle();

    // Lấy danh sách lượt thi và join thông tin học sinh
    const { data: attempts, error } = await this.supabaseClient
      .from('exam_attempts')
      .select(`
        id,
        session_id,
        user_id,
        start_time,
        submit_time,
        score,
        status,
        profiles!inner (
          full_name,
          username
        )
      `)
      .eq('session_id', id)
      .order('start_time', { ascending: true });

    if (error) throw error;

    const formattedAttempts = (attempts || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      fullName: row.profiles?.full_name || 'Học sinh ẩn danh',
      username: row.profiles?.username || 'user',
      startTime: row.start_time,
      submitTime: row.submit_time,
      score: row.score !== null ? parseFloat(row.score) : null,
      status: row.status,
    }));

    // Thống kê số lượng
    const totalAttempts = formattedAttempts.length;
    const inProgressCount = formattedAttempts.filter(a => a.status === 'inprogress').length;
    const submittedCount = formattedAttempts.filter(a => a.status === 'submitted' || a.status === 'graded').length;

    // Tính toán điểm số
    const scores = formattedAttempts
      .map(a => a.score)
      .filter((s): s is number => s !== null);

    const maxScore = scores.length > 0 ? Math.max(...scores) : null;
    const minScore = scores.length > 0 ? Math.min(...scores) : null;
    const avgScore = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : null;

    // Phân tích phổ điểm: 0-3, 3-5, 5-7, 7-8.5, 8.5-10
    const distribution = {
      '0 - 3': scores.filter(s => s >= 0 && s < 3).length,
      '3 - 5': scores.filter(s => s >= 3 && s < 5).length,
      '5 - 7': scores.filter(s => s >= 5 && s < 7).length,
      '7 - 8.5': scores.filter(s => s >= 7 && s < 8.5).length,
      '8.5 - 10': scores.filter(s => s >= 8.5 && s <= 10).length,
    };

    return {
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes,
        examTitle: exam?.title || 'Đề thi không tên',
      },
      stats: {
        totalAttempts,
        inProgressCount,
        submittedCount,
        maxScore,
        minScore,
        avgScore,
      },
      scoreDistribution: distribution,
      attempts: formattedAttempts,
    };
  }

  // --- Học sinh: Chức năng tham gia thi ---

  async enterSession(sessionId: string, userId: string, accessCode?: string | null): Promise<ExamSession> {
    const session = await this.repository.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Không tìm thấy đợt thi.');
    }

    if (session.status !== 'active') {
      throw new ForbiddenException('Đợt thi này chưa được kích hoạt hoặc đã kết thúc.');
    }

    const now = new Date();
    if (now < session.startTime) {
      throw new ForbiddenException(`Đợt thi chưa bắt đầu. Vui lòng quay lại vào ${session.startTime.toLocaleString('vi-VN')}`);
    }
    if (now > session.endTime) {
      throw new ForbiddenException('Đợt thi đã kết thúc.');
    }

    // Nếu thi trong khóa học, kiểm tra xem học sinh có thuộc khóa học không (kiểm tra phân quyền đăng ký)
    if (session.courseId) {
      // Vì hiện tại hệ thống chưa có bảng enrollments riêng rẽ, chúng ta có thể kiểm tra qua user_progress
      // Hoặc tạm thời cho phép tất cả học sinh đã đăng nhập vào thi
      // TODO: Thêm logic kiểm tra khóa học khi có bảng enrollments
    }

    // Xác thực access code
    if (session.accessCode && session.accessCode !== accessCode) {
      throw new ForbiddenException('Mật khẩu đợt thi không chính xác.');
    }

    return session;
  }

  async startAttempt(sessionId: string, userId: string, accessCode?: string | null): Promise<ExamAttempt> {
    const session = await this.enterSession(sessionId, userId, accessCode);

    // Kiểm tra xem học sinh đã có lượt làm bài cho đợt thi này chưa
    const existing = await this.repository.findAttemptByUserAndSession(userId, sessionId);
    if (existing) {
      return existing; // Trả về lượt thi cũ đang diễn ra hoặc đã hoàn thành
    }

    const attempt = new ExamAttempt(
      randomUUID(),
      sessionId,
      userId,
      new Date(),
      null,
      {},
      null,
      'inprogress',
      new Date(),
    );

    return this.repository.createAttempt(attempt);
  }

  async saveAttemptProgress(attemptId: string, userId: string, answers: Record<string, any>): Promise<ExamAttempt> {
    const attempt = await this.repository.findAttemptById(attemptId);
    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lượt thi.');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này.');
    }

    if (attempt.status !== 'inprogress') {
      throw new BadRequestException('Lượt thi đã được nộp hoặc kết thúc.');
    }

    attempt.answers = answers;
    return this.repository.updateAttempt(attempt);
  }

  async submitAttempt(attemptId: string, userId: string, answers: Record<string, any>): Promise<ExamAttempt> {
    const attempt = await this.repository.findAttemptById(attemptId);
    if (!attempt) {
      throw new NotFoundException('Không tìm thấy lượt thi.');
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này.');
    }

    if (attempt.status !== 'inprogress') {
      throw new BadRequestException('Bài thi đã nộp trước đó.');
    }

    const session = await this.repository.findById(attempt.sessionId);
    if (!session) {
      throw new NotFoundException('Không tìm thấy đợt thi tương ứng.');
    }

    // Kiểm tra thời gian hết hạn
    const now = new Date();
    if (now > session.endTime) {
      // Cho phép một khoảng trễ nhỏ (grace period) 2 phút do độ trễ mạng
      const gracePeriodEndTime = new Date(session.endTime.getTime() + 2 * 60000);
      if (now > gracePeriodEndTime) {
         // Đã quá hạn submit
         throw new BadRequestException('Đã quá thời gian cho phép nộp bài.');
      }
    }

    const durationMs = session.durationMinutes * 60 * 1000;
    // Cho phép thêm 2 phút trễ (grace period)
    if (now.getTime() - attempt.startTime.getTime() > durationMs + 2 * 60000) {
      throw new BadRequestException('Bạn đã vượt quá thời gian làm bài.');
    }

    attempt.answers = answers;
    attempt.submitTime = new Date();

    // --- TIẾN HÀNH CHẤM ĐIỂM TỰ ĐỘNG ---
    const { data: examQuestions, error: eqError } = await this.supabaseClient
      .from('exam_questions')
      .select(`
        points,
        question_id,
        questions!inner (
          type,
          tags,
          question_variants!inner (
            options,
            correct_answer
          )
        )
      `)
      .eq('exam_id', session.examId);

    if (eqError) throw eqError;

    let totalScore = 0;
    let hasEssay = false;

    if (examQuestions && examQuestions.length > 0) {
      for (const eq of examQuestions) {
        const qId = eq.question_id;
        const points = parseFloat(eq.points || 0);
        const question = eq.questions as any;
        if (!question) continue;

        const variant = question.question_variants?.[0];
        if (!variant) continue;

        const type = question.type;
        const tags = question.tags || [];
        const correctAnswer = variant.correct_answer;
        const studentAnswer = answers[qId];

        if (type === 'essay') {
          hasEssay = true;
          continue; // Câu tự luận bỏ qua chấm điểm tự động
        }

        if (studentAnswer === undefined || studentAnswer === null) continue;

        const isTrueFalse = tags.includes('type:true_false') || correctAnswer?.hasOwnProperty('trueIndices');

        if (isTrueFalse) {
          const trueIndices = correctAnswer?.trueIndices || [];
          const totalOptions = Array.isArray(variant.options) ? variant.options.length : 4;
          let correctCount = 0;
          
          if (typeof studentAnswer === 'object' && !Array.isArray(studentAnswer)) {
            for (let i = 0; i < totalOptions; i++) {
               const studentVal = studentAnswer[i];
               if (studentVal === 'true' || studentVal === 'false' || studentVal === true || studentVal === false) {
                 const isStudentTrue = studentVal === 'true' || studentVal === true;
                 const isActualTrue = trueIndices.includes(i);
                 if (isStudentTrue === isActualTrue) correctCount++;
               }
            }
          }
          
          // Chấm điểm theo chuẩn BGD (áp dụng cho câu có 4 ý)
          if (totalOptions === 4) {
            if (correctCount === 1) totalScore += points * 0.1;
            else if (correctCount === 2) totalScore += points * 0.25;
            else if (correctCount === 3) totalScore += points * 0.5;
            else if (correctCount === 4) totalScore += points;
          } else {
            // Nếu không phải 4 ý, tính theo tỷ lệ bình thường
            totalScore += points * (correctCount / totalOptions);
          }
        } else if (type === 'single_choice') {
          const studentChoice = typeof studentAnswer === 'object' ? studentAnswer?.index ?? studentAnswer?.optionIndex : studentAnswer;
          const correctChoice = correctAnswer?.index ?? correctAnswer?.optionIndex;
          if (studentChoice !== undefined && studentChoice !== null && studentChoice === correctChoice) {
            totalScore += points;
          }
        } else if (type === 'multiple_choice') {
          const studentChoices = Array.isArray(studentAnswer) ? studentAnswer : (studentAnswer?.indices ?? studentAnswer?.optionIndices ?? []);
          const correctChoices = correctAnswer?.indices ?? correctAnswer?.optionIndices ?? [];

          const isCorrect = studentChoices.length === correctChoices.length &&
            studentChoices.every((val: any) => correctChoices.includes(val));
          if (isCorrect) {
            totalScore += points;
          }
        }
      }
    }

    attempt.score = parseFloat(totalScore.toFixed(2));
    attempt.status = hasEssay ? 'submitted' : 'graded'; // Nếu có tự luận, trạng thái là submitted (chờ chấm), nếu ko có thì graded luôn
    attempt.gradedAt = hasEssay ? null : new Date();

    return this.repository.updateAttempt(attempt);
  }

  async getAttemptDetail(attemptId: string, userId: string): Promise<ExamAttempt> {
    const attempt = await this.repository.findAttemptById(attemptId);
    if (!attempt || attempt.userId !== userId) {
      throw new NotFoundException('Không tìm thấy lượt thi.');
    }
    return attempt;
  }

  async getAttemptExamData(attemptId: string, userId: string): Promise<any> {
    const attempt = await this.repository.findAttemptById(attemptId);
    if (!attempt || attempt.userId !== userId) {
      throw new NotFoundException('Không tìm thấy lượt thi.');
    }
    const session = await this.repository.findById(attempt.sessionId);
    if (!session) throw new NotFoundException('Không tìm thấy đợt thi.');

    // Fetch exam
    const { data: exam, error: examError } = await this.supabaseClient
      .from('exams')
      .select('id, title, header_content')
      .eq('id', session.examId)
      .single();

    if (examError || !exam) {
      throw new NotFoundException('Không tìm thấy đề thi.');
    }

    // Fetch questions
    const { data: examQuestions } = await this.supabaseClient
      .from('exam_questions')
      .select('id, exam_id, question_id, order_index, points')
      .eq('exam_id', session.examId)
      .order('order_index', { ascending: true });

    let mappedQuestions: any[] = [];
    if (examQuestions && examQuestions.length > 0) {
      const qIds = examQuestions.map(eq => eq.question_id);

      const { data: rawQuestions } = await this.supabaseClient
        .from('questions')
        .select('id, type, tags')
        .in('id', qIds);

      const { data: variants } = await this.supabaseClient
        .from('question_variants')
        .select('id, question_id, content, options, correct_answer, explanation')
        .in('question_id', qIds);

      const hideAnswers = attempt.status === 'inprogress';

      mappedQuestions = examQuestions.map(eq => {
        const q = (rawQuestions || []).find(q => q.id === eq.question_id);
        const v = (variants || []).filter(v => v.question_id === eq.question_id);
        return {
          id: eq.id,
          examId: eq.exam_id,
          questionId: eq.question_id,
          orderIndex: eq.order_index,
          points: eq.points,
          type: q?.type || 'single_choice',
          tags: q?.tags || [],
          variants: v.map(variant => ({
            id: variant.id,
            questionId: variant.question_id,
            content: variant.content,
            options: variant.options,
            correctAnswer: hideAnswers ? null : variant.correct_answer,
            explanation: hideAnswers ? null : variant.explanation
          }))
        };
      });
    }

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        headerContent: exam.header_content
      },
      questions: mappedQuestions
    };
  }
}
