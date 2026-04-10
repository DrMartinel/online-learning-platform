"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthRoutes = registerAuthRoutes;
const AuthController_1 = require("../../handlers/AuthController");
const errors_1 = require("../errors");
const supabase_1 = require("../supabase");
async function registerAuthRoutes(app) {
    app.post('/auth/signup', async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new AuthController_1.AuthController(supabase);
            const result = await controller.signUp(request.body);
            return reply.status(200).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return reply.status(statusCode).send(body);
        }
    });
    app.post('/auth/login', async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new AuthController_1.AuthController(supabase);
            const result = await controller.signIn(request.body);
            return reply.status(200).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return reply.status(statusCode).send(body);
        }
    });
    app.post('/auth/logout', async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new AuthController_1.AuthController(supabase);
            await controller.signOut();
            return reply.status(200).send({ success: true });
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return reply.status(statusCode).send(body);
        }
    });
}
