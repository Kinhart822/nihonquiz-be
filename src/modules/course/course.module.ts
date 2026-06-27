import { Module } from '@nestjs/common';
import { CourseRepository } from '@repositories/course.repository';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

@Module({
  imports: [TypeOrmExModule.forCustomRepository([CourseRepository])],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
