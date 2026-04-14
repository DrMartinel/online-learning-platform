"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const register_1 = require("./openapi/register");
const auth_1 = require("./routes/auth");
const course_1 = require("./routes/course");
const health_1 = require("./routes/health");
const lessons_1 = require("./routes/lessons");
async function buildServer() {
    const app = (0, fastify_1.default)({ logger: true });
    await (0, register_1.registerOpenApi)(app);
    await app.register(cors_1.default, { origin: true });
    await app.register(health_1.registerHealthRoutes);
    await app.register(auth_1.registerAuthRoutes);
<<<<<<< HEAD
    await app.register(course_1.registerCourseRoutes);
=======
    await app.register(lessons_1.registerLessonRoutes);
>>>>>>> 4fec35b (feat: implement CRUD use cases and repository for lesson management)
    return app;
}
async function main() {
    const app = await buildServer();
    const port = Number(process.env.PORT || 3001);
    const host = process.env.HOST || '0.0.0.0';
    await app.listen({ port, host });
}
main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
