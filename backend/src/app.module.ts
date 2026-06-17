import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { CourseModule } from './course/course.module';
import { LessonModule } from './lesson/lesson.module';
import { UserModule } from './user/user.module';
import { IamModule } from './iam/iam.module';
import { SystemAnalyticsModule } from './system-analytics/system-analytics.module';
import { RagModule } from './rag/rag.module';
import { QuestionModule } from './question/question.module';
import { ExamModule } from './exam/exam.module';
import { ExamSessionModule } from './exam-session/exam-session.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../.env',
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    CourseModule,
    LessonModule,
    UserModule,
    IamModule,
    SystemAnalyticsModule,
    RagModule,
    QuestionModule,
    ExamModule,
    ExamSessionModule,
    PaymentModule,
  ],
})
export class AppModule {}

