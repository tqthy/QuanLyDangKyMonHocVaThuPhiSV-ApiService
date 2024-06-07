import {
  availableCourseItem,
  courseRegistration,
  courseRegistrationItem,
  InsertAvailableCourseItem,
  student,
} from "@db/schema";
import { CloseCurrentStateDto } from "@module/course-open/dto/close-current-state.dto";
import { CreateCourseOpenDto } from "@module/course-open/dto/create-course-open.dto";
import { DeleteCourseOpenDto } from "@module/course-open/dto/delete-course-open.dto";
import { HttpService } from "@nestjs/axios";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  resolveTerm,
  reverseTerm,
} from "@repository/course-registration/helper/resolveTerm";
import { Drizzle } from "@type/drizzle.type";
import { TERM } from "@util/constants";
import { and, eq, inArray } from "drizzle-orm";
import { firstValueFrom } from "rxjs";

@Injectable()
export class CourseOpenRepository {
  constructor(
    @Inject("DRIZZLE") private drizzle: Drizzle,
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private taskStatuses = new Map<string, "running" | "completed">();

  async closeCurrentState(closeCurrentStateDto: CloseCurrentStateDto) {
    const url = this.configService.get<string>("service");
    const { data } = await firstValueFrom(
      this.httpService.patch(
        `${url}/registrationState/?term=${resolveTerm(closeCurrentStateDto.term)}&year=${closeCurrentStateDto.year}`,
      ),
    );

    return data;
  }

  async create(createCourseOpenDto: CreateCourseOpenDto) {
    const url = this.configService.get<string>("service");
    const { data: stateData } = await firstValueFrom(
      this.httpService.get(
        `${url}/registration_state?stateId=${createCourseOpenDto.stateId}`,
      ),
    );

    if (!stateData || !stateData.available) {
      throw new Error("State does not available for registration");
    }

    const { data } = await firstValueFrom(
      this.httpService.post(`${url}/open_course`, createCourseOpenDto),
    );

    // Register students in background
    this.registerStudentsInBackground(createCourseOpenDto, stateData).catch(
      (error) => {
        console.error("Failed to register students in background:", error);
      },
    );

    return data;
  }

  // Background task for registering students
  private async registerStudentsInBackground(
    createCourseOpenDto: CreateCourseOpenDto,
    stateData: any,
  ) {
    const taskId = `registration-${createCourseOpenDto.stateId}`;
    this.taskStatuses.set(taskId, "running");

    try {
      const students = await this.drizzle.query.student.findMany({
        where: eq(student.majorId, createCourseOpenDto.majorId),
      });

      const registrations = students.map((student) => ({
        term: reverseTerm(stateData.term),
        year: stateData.year,
        registrationDate: new Date().toDateString(),
        studentId: student.id,
      }));

      const insertedRegistrations = await this.drizzle
        .insert(courseRegistration)
        .values(registrations)
        .returning();

      const registrationItems = [];
      insertedRegistrations.forEach((registration) => {
        createCourseOpenDto.courses.forEach((courseOpen) => {
          registrationItems.push({
            courseRegistrationId: registration.id,
            courseId: courseOpen.courseId,
          });
        });
      });

      await this.drizzle
        .insert(courseRegistrationItem)
        .values(registrationItems)
        .returning();

      this.taskStatuses.set(taskId, "completed");
    } catch (error) {
      console.error("Failed to register students in background:", error);
      this.taskStatuses.set(taskId, "completed"); // consider handling errors differently
    }
  }

  private async deleteCourseRegistrationInBackground(
    majorId: number,
    term: TERM,
    year: number,
  ) {
    try {
      const registrations =
        await this.drizzle.query.courseRegistration.findMany({
          where: and(
            eq(courseRegistration.term, term),
            eq(courseRegistration.year, year),
          ),
        });

      const registrationIds = registrations.map(
        (registration) => registration.id,
      );
      await this.drizzle
        .delete(courseRegistrationItem)
        .where(
          inArray(courseRegistrationItem.courseRegistrationId, registrationIds),
        );
      await this.drizzle
        .delete(courseRegistration)
        .where(inArray(courseRegistration.id, registrationIds));
    } catch (error) {
      console.error(
        "Failed to delete course registration in background:",
        error,
      );
    }
  }

  async delete(deleteCourseOpenDto: DeleteCourseOpenDto) {
    // check if the backgroud task for course registration is running, if not, proceed with deletion
    if (
      this.taskStatuses.get(
        `registration-${deleteCourseOpenDto.openCourseId}`,
      ) === "running"
    ) {
      throw new Error("Cannot delete while registration is in progress");
    }

    const url = this.configService.get<string>("service");
    // get state
    const { data: stateData } = await firstValueFrom(
      this.httpService.get(
        `${url}/registration_state?stateId=${deleteCourseOpenDto.stateId}`,
      ),
    );

    if (!stateData || !stateData.available) {
      throw new Error("State does not available for deletion");
    }
    const { data: openCourseData } = await firstValueFrom(
      this.httpService.get(
        `${url}/open_course/?id=${deleteCourseOpenDto.openCourseId}`,
      ),
    );

    const { data } = await firstValueFrom(
      this.httpService.delete(
        `${url}/open_course/?id=${deleteCourseOpenDto.openCourseId}`,
      ),
    );

    //background task to delete course registration and items
    this.deleteCourseRegistrationInBackground(
      openCourseData.major.majorId,
      reverseTerm(stateData.term),
      stateData.year,
    ).catch((error) => {
      console.error(
        "Failed to delete course registration in background:",
        error,
      );
    });
    return data;
  }

  async findAllOneTerm(term: TERM, year: number) {
    const termResolved = resolveTerm(term);
    const url = this.configService.get<string>("service");
    const { data: stateData } = await firstValueFrom(
      this.httpService.get(
        `${url}/registration_state?term=${termResolved}&year=${year}`,
      ),
    );

    const stateId = stateData._id;

    const { data: openCourseData } = await firstValueFrom(
      this.httpService.get(`${url}/open_course?stateId=${stateId}`),
    );

    const result = {
      available: stateData.available,
      stateId: stateData._id,
      openCourseData,
    };

    return result;
  }

  async createCourseOpen(item: InsertAvailableCourseItem) {
    // check if courseId exists
    const checkForCourseExistence =
      await this.drizzle.query.availableCourseItem.findFirst({
        where: and(
          eq(availableCourseItem.courseId, item.courseId),
          eq(availableCourseItem.availableCourseId, item.availableCourseId),
        ),
      });

    if (checkForCourseExistence) {
      throw new Error("Course already exists");
    }
    const courseOpen = await this.drizzle
      .insert(availableCourseItem)
      .values(item)
      .returning();

    return courseOpen[0];
  }
}
