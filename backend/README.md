# Online Learning Platform - Backend (NestJS)

This backend is built using **NestJS**, a progressive Node.js framework, and **pnpm** as the package manager. It interacts with our self-hosted Supabase infrastructure using the Supabase JS client.

## Architecture

The application is structured into **Feature-Based Modules**. This modular approach ensures high cohesion, scalability, and maintainability.

Each major feature (e.g., `auth`, `course`, `lesson`, `user`, `user-progress`) has its own dedicated directory under `src/`.

### Typical Module Folder Structure

Let's look at the `src/course` feature as an example:

```
src/course/
├── course.module.ts              # The module definition file that bundles controllers and providers.
├── course.controller.ts          # The presentation layer handling incoming HTTP requests.
├── course.service.ts             # The application layer containing core business logic (Use Cases).
├── ICourseRepository.ts          # The interface defining database operations for this domain.
├── supabase-course.repository.ts # The infrastructure layer implementing the repository using Supabase.
├── dto/
│   └── course.dto.ts             # Data Transfer Objects (Zod schemas mapped via nestjs-zod).
└── entities/
    └── Course.ts                 # Domain models/classes representing business rules and state.
```

### How Each File Works

1. **Entities (`entities/Course.ts`)**:
   - Represents the core domain model. It contains the business state and rules (e.g., methods to `publish()`, validation logic intrinsic to the entity).
   - They do *not* know anything about databases or HTTP.

2. **DTOs (`dto/course.dto.ts`)**:
   - Defines the shape of data entering and leaving the system.
   - We use `zod` for strict schema definitions and `nestjs-zod`'s `createZodDto` to seamlessly integrate these schemas into NestJS Validation Pipes and Swagger (OpenAPI) generation.

3. **Repository Interface (`ICourseRepository.ts`)**:
   - An abstraction describing what database operations are possible.
   - Using interfaces allows the Service to be completely decoupled from the specific database implementation.

4. **Repository Implementation (`supabase-course.repository.ts`)**:
   - The concrete implementation of the Repository interface.
   - This file interacts directly with the `SupabaseClient` to perform CRUD operations, mapping the database rows back into pure Domain Entities.

5. **Service (`course.service.ts`)**:
   - The heart of the feature's business logic (formerly known as "Use Cases").
   - Services validate business rules, call Repositories to persist data, and orchestrate complex operations.
   - Services *inject* the Repository interface using Dependency Injection.

6. **Controller (`course.controller.ts`)**:
   - The presentation layer. It defines HTTP endpoints (`@Get()`, `@Post()`, etc.).
   - It intercepts the HTTP request, invokes the appropriate Service method, and returns the response.
   - Contains Swagger decorators (`@ApiOperation`, `@ApiResponse`) for generating interactive API documentation.

7. **Module (`course.module.ts`)**:
   - Binds everything together. It registers the Controller, the Service, and provides the concrete Repository implementation for the `ICourseRepository` injection token.

## Global Context (`src/app.module.ts` & `src/main.ts`)

- `app.module.ts`: The root module that imports all feature modules (Auth, Course, User, etc.) as well as the global `DatabaseModule` which provides the `SupabaseClient`.
- `main.ts`: The bootstrap file that spins up the server, enables CORS, registers global Validation Pipes (`ZodValidationPipe`), and generates the Swagger UI.

## Testing

- **Unit Testing**: `.spec.ts` files reside next to the classes they test (e.g., `course.service.spec.ts`). Run them via `pnpm run test`.
- **E2E Testing**: E2E tests are located in the `/test` directory. Run them via `pnpm run test:e2e`.

## Common Commands

```bash
# Start development server with hot-reload
pnpm run start:debug

# Build the project
pnpm run build

# Format and Lint
pnpm run format
pnpm run lint

# Run Tests & Coverage
pnpm run test
```

## Developer Workflow / Post-Coding Checklist

Once you've completed a feature or made code modifications, you must ensure the codebase remains clean, tested, and strictly structured. Follow these steps:

1. **Format & Lint**: Always format your code with `pnpm run format` and verify there are no linting errors (`pnpm run lint`).
2. **Compile Check**: Run `pnpm run build` to verify there are no TypeScript compilation errors (especially concerning cross-module imports or decorators).
3. **Unit Tests & Code Coverage**:
   - Write unit tests for every newly added Service and Controller.
   - Run `pnpm run test` to execute Jest.
   - **Important**: This project enforces a **minimum of 70% code coverage** globally across branches, functions, lines, and statements. If coverage dips below 70%, Jest will throw an error.
4. **Git Pre-commit Hook**: A Husky `pre-commit` hook is configured at the root repository. Every time you attempt to `git commit`, the hook will automatically navigate to the `backend/` directory, execute `pnpm run test`, and block the commit if the tests fail or if the code coverage is below the 70% threshold.
