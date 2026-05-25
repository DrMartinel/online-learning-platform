import { SupabaseClient } from '@supabase/supabase-js';
import { Question } from '../entities/Question';
import { QuestionVariant, McqOption } from '../entities/QuestionVariant';
import { IQuestionRepository } from './IQuestionRepository';
import { ListQuestionsFilterDTO } from '../dto/question.dto';

export class SupabaseQuestionRepository implements IQuestionRepository {
  constructor(private client: SupabaseClient) {}

  // --- Mappers ---

  private mapToQuestion(row: any): Question {
    return new Question(
      row.id,
      row.type,
      row.tags || [],
      new Date(row.created_at),
      row.updated_at ? new Date(row.updated_at) : undefined,
    );
  }

  private mapToVariant(row: any): QuestionVariant {
    return new QuestionVariant(
      row.id,
      row.question_id,
      row.variant_index,
      row.content,
      row.options as McqOption[] | null,
      row.correct_answer,
      row.explanation,
      new Date(row.created_at),
    );
  }

  // --- Question CRUD ---

  async create(question: Question): Promise<Question> {
    const { data, error } = await this.client
      .from('questions')
      .insert({
        id: question.id,
        type: question.type,
        tags: question.tags,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToQuestion(data);
  }

  async findById(id: string): Promise<Question | null> {
    const { data, error } = await this.client
      .from('questions')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToQuestion(data);
  }

  async findAll(filter?: ListQuestionsFilterDTO): Promise<Question[]> {
    let query = this.client.from('questions').select();

    if (filter?.type) {
      query = query.eq('type', filter.type);
    }
    if (filter?.tag) {
      query = query.contains('tags', [filter.tag]);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data.map((row: any) => this.mapToQuestion(row));
  }

  async update(question: Question): Promise<Question> {
    const { data, error } = await this.client
      .from('questions')
      .update({
        type: question.type,
        tags: question.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', question.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToQuestion(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // --- Variant CRUD ---

  async createVariant(variant: QuestionVariant): Promise<QuestionVariant> {
    const { data, error } = await this.client
      .from('question_variants')
      .insert({
        id: variant.id,
        question_id: variant.questionId,
        variant_index: variant.variantIndex,
        content: variant.content,
        options: variant.options,
        correct_answer: variant.correctAnswer,
        explanation: variant.explanation,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToVariant(data);
  }

  async findVariantsByQuestionId(questionId: string): Promise<QuestionVariant[]> {
    const { data, error } = await this.client
      .from('question_variants')
      .select()
      .eq('question_id', questionId)
      .order('variant_index', { ascending: true });

    if (error) throw error;
    return data.map((row: any) => this.mapToVariant(row));
  }

  async findVariantById(id: string): Promise<QuestionVariant | null> {
    const { data, error } = await this.client
      .from('question_variants')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToVariant(data);
  }

  async updateVariant(variant: QuestionVariant): Promise<QuestionVariant> {
    const { data, error } = await this.client
      .from('question_variants')
      .update({
        content: variant.content,
        options: variant.options,
        correct_answer: variant.correctAnswer,
        explanation: variant.explanation,
      })
      .eq('id', variant.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToVariant(data);
  }

  async deleteVariant(id: string): Promise<void> {
    const { error } = await this.client
      .from('question_variants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getNextVariantIndex(questionId: string): Promise<number> {
    const { data, error } = await this.client
      .from('question_variants')
      .select('variant_index')
      .eq('question_id', questionId)
      .order('variant_index', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return 0;
    return data[0].variant_index + 1;
  }
}
