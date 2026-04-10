"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHealthRoutes = registerHealthRoutes;
async function registerHealthRoutes(app) {
    app.get('/health', async (_request, reply) => {
        return reply.status(200).send({ ok: true });
    });
}
