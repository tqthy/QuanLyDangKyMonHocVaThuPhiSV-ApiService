import { Module, DynamicModule } from "@nestjs/common";
import { AuthRepository } from "@repository/auth/auth.repostiory";
import { UserRepository } from "@repository/user/user.repository";
import { PriorityRepository } from "@repository/priority/priority.repository";
import { StudentRepository } from "@repository/student/student.repository";
import { ProvinceDistrictRepository } from "@repository/province/province.repository";
import { MajorRepository } from "@repository/major/major.repository";
import { CourseRegistrationRepository } from "@repository/course-registration/course-registration.repository";
import { TuitionPaymentRepository } from "@repository/tuition-payment/tuition-payment-repository";
import { TuitionRepository } from "@repository/tuition/tuition.repository";
import { HttpModule } from "@nestjs/axios";
import { CourseOpenRepository } from "@repository/course-open/course-open.repository";
import { CourseRepository } from "@repository/course/course.repository";
import { CourseOpenTermRepository } from "@repository/course-open/course-open-term.repository";
@Module({})
export class RepositoryModule {
  static forRoot({ isGlobal = false }): DynamicModule {
    return {
      global: isGlobal,
      module: RepositoryModule,
      imports: [HttpModule],
      providers: [
        UserRepository,
        AuthRepository,
        PriorityRepository,
        StudentRepository,
        ProvinceDistrictRepository,
        MajorRepository,
        CourseRegistrationRepository,
        CourseOpenTermRepository,
        CourseRepository,
        TuitionPaymentRepository,
        TuitionRepository,
        CourseOpenRepository,
      ],
      exports: [
        UserRepository,
        AuthRepository,
        PriorityRepository,
        StudentRepository,
        ProvinceDistrictRepository,
        MajorRepository,
        CourseRegistrationRepository,
        TuitionPaymentRepository,
        TuitionRepository,
        CourseOpenRepository,
        CourseOpenTermRepository,
        CourseRepository,
      ],
    };
  }
}
