import { CreateCourseDto } from "@module/course/dto/create-course.dto";
import { FilterCourseDto } from "@module/course/dto/filter-course.dto";
import { UpdateCourseDto } from "@module/course/dto/update-course.dto";
import { Inject, Injectable } from "@nestjs/common";
import { eq, like } from "drizzle-orm";
import { course } from "src/db/schema";
import { Drizzle } from "src/type/drizzle.type";

@Injectable()
export class CourseRepository {
  constructor(@Inject("DRIZZLE") private drizzle: Drizzle) {}

  async create(body: CreateCourseDto) {
    return await this.drizzle.insert(course).values(body).returning();
  }

  async findAll() {
    return await this.drizzle.select().from(course);
  }

  async findAllByFilter({ search }: FilterCourseDto) {
    return await this.drizzle
      .select()
      .from(course)
      .where(like(course.name, `%${search}%`));
  }

  async findOne(id: number) {
    return await this.drizzle.select().from(course).where(eq(course.id, id));
  }

  async update(id: number, body: UpdateCourseDto) {
    return await this.drizzle
      .update(course)
      .set(body)
      .where(eq(course.id, id))
      .returning();
  }

  async remove(id: number) {
    return await this.drizzle
      .delete(course)
      .where(eq(course.id, id))
      .returning();
  }
}