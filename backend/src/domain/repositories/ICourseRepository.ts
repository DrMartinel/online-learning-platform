import { Course } from '../entities/Course';
import { ListCoursesFilterDTO } from '../../application/dtos/CourseDTOs';

export interface ICourseRepository {
  create(course: Course): Promise<Course>;
  findById(id: string): Promise<Course | null>;
  findAll(filter?: ListCoursesFilterDTO): Promise<Course[]>;
  update(course: Course): Promise<Course>;
  delete(id: string): Promise<void>;
}
