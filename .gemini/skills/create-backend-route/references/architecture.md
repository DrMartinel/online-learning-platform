# Backend Route Architecture

This project follows a Clean Architecture approach. Adding a new route involves several layers:

## 1. DTOs (Data Transfer Objects)
- **Location:** `backend/src/application/dtos/`
- **Pattern:** Use **Zod** for schema definition and `z.infer` for types.
- **Example:**
  ```typescript
  export const myRequestSchema = z.object({ ... });
  export type MyRequestDTO = z.infer<typeof myRequestSchema>;
  ```

## 2. Controllers
- **Location:** `backend/src/presentation/handlers/`
- **Pattern:** Controllers orchestrate Use Cases and are initialized with a `SupabaseClient`.
- **Example:**
  ```typescript
  export class MyController {
    constructor(supabaseClient: SupabaseClient) {
      this.myUseCase = new MyUseCase(new MyRepository(supabaseClient));
    }
  }
  ```

## 3. OpenAPI Schemas
- **Location:** `backend/src/presentation/http/openapi/schemas.ts`
- **Pattern:** Export JSON schemas for Fastify/Swagger derived from Zod.
- **Example:**
  ```typescript
  export const myBodySchema = toOpenApiSchema(myRequestSchema as ZodTypeAny);
  ```

## 4. Routes
- **Location:** `backend/src/presentation/http/routes/`
- **Pattern:** Register Fastify routes, providing generic types for the request body and linking to the controller.
- **Example:**
  ```typescript
  app.post<{ Body: MyRequestDTO }>(
    '/my-path',
    { schema: { body: myBodySchema, response: { 200: myResponseSchema } } },
    async (request, reply) => {
      const supabase = createSupabaseClientForRequest(request.headers.authorization);
      const controller = new MyController(supabase);
      const result = await controller.execute(request.body);
      return reply.status(200).send(result);
    }
  );
  ```

## 5. Server Registration
- **Location:** `backend/src/presentation/http/server.ts`
- **Pattern:** Register the new route file in `buildServer`.
- **Example:**
  ```typescript
  await app.register(registerMyRoutes);
  ```
