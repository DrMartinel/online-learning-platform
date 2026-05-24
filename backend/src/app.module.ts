import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { CourseModule } from './course/course.module';
import { LessonModule } from './lesson/lesson.module';
import { UserModule } from './user/user.module';
import { IamModule } from './iam/iam.module';
import { SystemAnalyticsModule } from './system-analytics/system-analytics.module';

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
  ],
})
export class AppModule {}
