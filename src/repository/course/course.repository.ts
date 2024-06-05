import { CreateCourseDto } from "@module/course/dto/create-course.dto";
import { FilterCourseDto } from "@module/course/dto/filter-course.dto";
import { UpdateCourseDto } from "@module/course/dto/update-course.dto";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { and, eq, inArray, like } from "drizzle-orm";
import { course } from "@db/schema";
import { Drizzle } from "@type/drizzle.type";

@Injectable()
export class CourseRepository {
  constructor(@Inject("DRIZZLE") private drizzle: Drizzle) {}

  async create(body: CreateCourseDto) {
    return await this.drizzle.insert(course).values(body).returning();
  }

  async findAll() {
    return await this.drizzle.query.course.findMany({
      with: {
        courseType: true,
        faculty: true,
      },
      where: eq(course.isDeleted, false),
    });
  }

  async findAllByFilter({ search }: FilterCourseDto) {
    return await this.drizzle.query.course.findMany({
      where: and(eq(course.isDeleted, false), like(course.name, `%${search}%`)),
      with: {
        courseType: true,
        faculty: true,
      },
    });
  }

  async findOne(id: number) {
    return await this.drizzle.query.course.findFirst({
      where: and(eq(course.id, id), eq(course.isDeleted, false)),
      with: {
        courseType: true,
        faculty: true,
      },
    });
  }

  async update(id: number, body: UpdateCourseDto) {
    if (body.numberOfPeriods) {
      // set the current course isDeleted to true
      const prevCourse = await this.drizzle
        .update(course)
        .set({ isDeleted: true })
        .where(eq(course.id, id))
        .returning();

      if (!prevCourse.length) {
        return new HttpException("Course not found", HttpStatus.NOT_FOUND);
      }

      // create a new course with the updated values
      let newCourse = {
        name: null,
        courseTypeId: null,
        facultyId: null,
        numberOfPeriods: body.numberOfPeriods,
      };

      if (!body.name) {
        newCourse = { name: prevCourse[0].name, ...newCourse };
      } else {
        newCourse = { name: body.name, ...newCourse };
      }
      if (!body.courseTypeId) {
        newCourse = { courseTypeId: prevCourse[0].courseTypeId, ...newCourse };
      } else {
        newCourse = { courseTypeId: body.courseTypeId, ...newCourse };
      }
      if (!body.facultyId) {
        newCourse = { facultyId: prevCourse[0].facultyId, ...newCourse };
      } else {
        newCourse = { facultyId: body.facultyId, ...newCourse };
      }

      return await this.drizzle.insert(course).values(newCourse).returning();
    } else {
      return await this.drizzle
        .update(course)
        .set(body)
        .where(eq(course.id, id))
        .returning();
    }
  }

  async remove(id: number) {
    // return await this.drizzle
    //   .delete(course)
    //   .where(eq(course.id, id))
    //   .returning();
    return await this.drizzle
      .update(course)
      .set({ isDeleted: true })
      .where(eq(course.id, id))
      .returning();
  }

  async findByIds(ids: number[]) {
    return await this.drizzle.query.course.findMany({
      columns: {
        courseTypeId: false,
        facultyId: false,
      },
      where: and(inArray(course.id, ids), eq(course.isDeleted, false)),
      with: {
        courseType: true,
        faculty: true,
      },
    });
  }
}
