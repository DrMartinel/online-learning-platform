---
name: create-backend-route
description: Add a new API route to the NestJS backend, including DTOs, services, controllers, Swagger documentation, and unit tests.
---

# Create Backend Route

This skill provides the workflow for adding new HTTP endpoints to the backend service, ensuring the NestJS feature-based modular architecture and testing standards are properly maintained.

## Workflow

To create a new backend route, follow these steps in order within the specific feature module (e.g., `src/course/`):

### 1. Define the DTOs
Define request and response schemas using **Zod** in the feature's `dto/` directory (e.g., `src/course/dto/course.dto.ts`).
- Define the base Zod schema using `z.object(...).strict()` for strict input validation.
- Export the schema and use `createZodDto` from `nestjs-zod` to export the class so NestJS can use it for validation and Swagger documentation.

### 2. Implement or Update the Service
Implement the core business logic inside the feature's service file in `services/`.
- Ensure the service interacts with the Database layer via the defined Repository interface, not direct Supabase clients.
- Map the data to the appropriate Response DTO before returning it.

### 3. Implement the Controller Route
Create or update the relevant route in the controller under `controllers/`.
- Use standard NestJS decorators (`@Get()`, `@Post()`, `@Param()`, `@Body()`).
- Because we use `nestjs-zod` globally, you simply type the `@Body()` parameter with your DTO and validation will be automatic.

### 4. Document with Swagger
Attach `@nestjs/swagger` decorators to the controller method to generate the OpenAPI documentation automatically.
- Use `@ApiOperation({ summary: '...' })` for a brief description.
- Use `@ApiResponse({ status: 200, type: MyResponseDTO })` to document expected return models. `nestjs-zod` will correctly translate the Zod models into OpenAPI shapes.

### 5. Register in the Module
If this is a brand new controller or service, ensure it is added to the `controllers` and `providers` arrays in the feature's `.module.ts` file.

### 6. Generate Unit Tests (Required)
The project strictly enforces a 70% code coverage minimum. As part of creating this route, you **MUST automatically generate** mock-based unit tests for both the Controller and the Service.

**Service Test Template (`test/<feature>.service.spec.ts`):**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from '../services/my.service';

describe('MyService', () => {
  let service: MyService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: 'IMyRepository',
          useValue: { /* mock repo methods returning jest.fn() */ },
        },
      ],
    }).compile();
    service = module.get<MyService>(MyService);
    repo = module.get('IMyRepository');
  });

  it('should be defined', () => expect(service).toBeDefined());
  // Add detailed mocked tests for your specific route logic here...
});
```

**Controller Test Template (`test/<feature>.controller.spec.ts`):**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyController } from '../controllers/my.controller';
import { MyService } from '../services/my.service';

describe('MyController', () => {
  let controller: MyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyController],
      providers: [
        {
          provide: MyService,
          useValue: { /* mock service methods returning jest.fn().mockResolvedValue(...) */ },
        },
      ],
    }).compile();
    controller = module.get<MyController>(MyController);
  });

  it('should be defined', () => expect(controller).toBeDefined());
  // Add endpoint execution tests here...
});
```

- Run `pnpm run test` locally to ensure coverage is maintained.

## Architectural Reference
The backend follows a Feature-Based Modular Architecture. See `backend/README.md` for full layout explanations.
