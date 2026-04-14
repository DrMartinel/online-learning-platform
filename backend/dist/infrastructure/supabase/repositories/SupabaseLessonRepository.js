"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseLessonRepository = void 0;
class SupabaseLessonRepository {
    client;
    constructor(client) {
        this.client = client;
    }
    mapToLesson(row) {
        return {
            id: row.id,
            courseId: row.course_id,
            title: row.title,
            videoUrl: row.video_url,
            content: row.content,
            orderIndex: row.order_index,
            createdAt: row.created_at,
        };
    }
    async create(lesson) {
        const { data, error } = await this.client
            .from('lessons')
            .insert({
            course_id: lesson.courseId,
            title: lesson.title,
            video_url: lesson.videoUrl,
            content: lesson.content,
            order_index: lesson.orderIndex,
        })
            .select()
            .single();
        if (error)
            throw error;
        return this.mapToLesson(data);
    }
    async findById(id) {
        const { data, error } = await this.client
            .from('lessons')
            .select()
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        if (!data)
            return null;
        return this.mapToLesson(data);
    }
    async findByCourseId(courseId) {
        const { data, error } = await this.client
            .from('lessons')
            .select()
            .eq('course_id', courseId)
            .order('order_index', { ascending: true });
        if (error)
            throw error;
        return data.map(this.mapToLesson);
    }
    async update(id, lesson) {
        const updates = {};
        if (lesson.title !== undefined)
            updates.title = lesson.title;
        if (lesson.videoUrl !== undefined)
            updates.video_url = lesson.videoUrl === null ? null : lesson.videoUrl;
        if (lesson.content !== undefined)
            updates.content = lesson.content === null ? null : lesson.content;
        if (lesson.orderIndex !== undefined)
            updates.order_index = lesson.orderIndex;
        const { data, error } = await this.client
            .from('lessons')
            .update(updates)
            .eq('id', id)
            .select()
            .maybeSingle();
        if (error)
            throw error;
        if (!data)
            return null;
        return this.mapToLesson(data);
    }
    async delete(id) {
        const { error } = await this.client
            .from('lessons')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
}
exports.SupabaseLessonRepository = SupabaseLessonRepository;
