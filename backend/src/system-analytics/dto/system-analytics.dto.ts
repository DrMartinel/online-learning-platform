import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const MetricPointSchema = z.object({
  time: z.string(),
  count: z.number(),
});

export class MetricPointDTO extends createZodDto(MetricPointSchema) {}
