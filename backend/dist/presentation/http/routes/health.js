"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHealthRoutes = registerHealthRoutes;
const schemas_1 = require("../openapi/schemas");
async function registerHealthRoutes(app) {
    app.get('/health', {
        schema: {
            tags: ['Health'],
            summary: 'Health check',
            description: 'Returns 200 when the API process is running.',
            response: {
                200: schemas_1.healthOkSchema,
            },
        },
    }, async (_request, reply) => {
        return reply.status(200).send({ ok: true });
    });
}
