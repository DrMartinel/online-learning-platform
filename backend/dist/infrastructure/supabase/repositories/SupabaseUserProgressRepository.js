"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseUserProgressRepository = void 0;
class SupabaseUserProgressRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async findByUserAndLesson(userId, lessonId) {
        const { data, error } = await this.supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .maybeSingle();
        if (error)
            throw new Error(error.message);
        if (!data)
            return null;
        return this.mapToDTO(data);
    }
    async findByUserAndCourse(userId, courseId) {
        const { data, error } = await this.supabase
            .from('user_progress')
            .select('*, lessons!inner(course_id)')
            .eq('user_id', userId)
            .eq('lessons.course_id', courseId);
        if (error)
            throw new Error(error.message);
        return (data || []).map(this.mapToDTO);
    }
    async findById(id) {
        const { data, error } = await this.supabase
            .from('user_progress')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new Error(error.message);
        if (!data)
            return null;
        return this.mapToDTO(data);
    }
    async create(userId, dto) {
        const { data, error } = await this.supabase
            .from('user_progress')
            .insert({
            user_id: userId,
            lesson_id: dto.lessonId,
            completed: dto.completed,
            completed_at: dto.completed ? new Date().toISOString() : null,
        })
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return this.mapToDTO(data);
    }
    async update(id, dto) {
        const { data, error } = await this.supabase
            .from('user_progress')
            .update({
            completed: dto.completed,
            completed_at: dto.completed ? new Date().toISOString() : null,
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return this.mapToDTO(data);
    }
    async delete(id) {
        const { error } = await this.supabase
            .from('user_progress')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(error.message);
    }
    async countCompletedLessonsInCourse(userId, courseId) {
        const { count, error } = await this.supabase
            .from('user_progress')
            .select('*, lessons!inner(course_id)', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)
            .eq('lessons.course_id', courseId);
        if (error)
            throw new Error(error.message);
        return count || 0;
    }
    async countTotalLessonsInCourse(courseId) {
        const { count, error } = await this.supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId);
        if (error)
            throw new Error(error.message);
        return count || 0;
    }
    mapToDTO(row) {
        return {
            id: row.id,
            userId: row.user_id,
            lessonId: row.lesson_id,
            completed: row.completed,
            completedAt: row.completed_at,
        };
    }
}
exports.SupabaseUserProgressRepository = SupabaseUserProgressRepository;
