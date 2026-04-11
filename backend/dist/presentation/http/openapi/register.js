"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOpenApi = registerOpenApi;
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
async function registerOpenApi(app) {
    await app.register(swagger_1.default, {
        openapi: {
            openapi: '3.0.3',
            info: {
                title: 'Online Learning Platform API',
                description: 'HTTP API for authentication and platform operations. Uses Supabase under the hood; send `Authorization: Bearer <access_token>` when acting as an authenticated user.',
                version: '1.0.0',
            },
            servers: [{ url: '/', description: 'This server' }],
            tags: [
                { name: 'Health', description: 'Liveness' },
                { name: 'Auth', description: 'Sign up, sign in, sign out' },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'Supabase access token (JWT)',
                    },
                },
            },
        },
    });
    await app.register(swagger_ui_1.default, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
        staticCSP: true,
    });
}
