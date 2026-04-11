import { FastifyReply, FastifyRequest } from 'fastify';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateUserProgressDTO, UpdateUserProgressDTO } from '../../application/dtos/UserProgressDTOs';
export declare class UserProgressController {
    private readonly supabase;
    private repository;
    constructor(supabase: SupabaseClient);
    private getUserId;
    getCourseProgress(request: FastifyRequest<{
        Params: {
            courseId: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    getLessonProgress(request: FastifyRequest<{
        Params: {
            lessonId: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    createProgress(request: FastifyRequest<{
        Body: CreateUserProgressDTO;
    }>, reply: FastifyReply): Promise<never>;
    updateProgress(request: FastifyRequest<{
        Params: {
            id: string;
        };
        Body: UpdateUserProgressDTO;
    }>, reply: FastifyReply): Promise<never>;
    deleteProgress(request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
}
//# sourceMappingURL=UserProgressController.d.ts.map