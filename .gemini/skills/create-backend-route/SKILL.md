---
name: create-backend-route
description: Add a new API route to the Fastify backend, including DTOs, controllers, and OpenAPI documentation.
---

# Create Backend Route

This skill provides the workflow for adding new HTTP endpoints to the backend service, ensuring all architectural layers are properly updated.

## Workflow

To create a new backend route, follow these steps in order:

### 1. Define the DTOs
Define request and response schemas using **Zod** in a relevant file under `backend/src/application/dtos/`.
- Use `z.object(...).strict()` for strict input validation.
- Export both the schema (for validation) and the inferred TypeScript type.

### 2. Update OpenAPI Schemas
Update `backend/src/presentation/http/openapi/schemas.ts` to export JSON schemas derived from your Zod objects.
- Use `toOpenApiSchema()` to convert Zod types.
- Ensure all body and response schemas used in routes are registered here.

### 3. Implement or Update Controller
Ensure there is a controller in `backend/src/presentation/handlers/` to handle the business logic.
- Controllers should accept a `SupabaseClient` in the constructor.
- Logic should ideally be delegated to Use Cases.

### 4. Register the Route
Add or update a route registration file in `backend/src/presentation/http/routes/`.
- Use `FastifyInstance` to register the route (e.g., `app.post`, `app.get`).
- Link the route to the appropriate controller method.
- Include full OpenAPI documentation in the `schema` object (tags, summary, description, body, response).
- Handle errors using `toHttpError()` and `sendError()`.

### 5. Wire up the Server
If you created a new route file, register it in `backend/src/presentation/http/server.ts` within the `buildServer` function.

## Architectural Reference
For more details on the layer structure and code patterns, see [architecture.md](references/architecture.md).
