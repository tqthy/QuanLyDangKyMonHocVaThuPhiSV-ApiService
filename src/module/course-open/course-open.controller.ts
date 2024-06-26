import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CourseOpenService } from "./course-open.service";
import { END_POINTS } from "@util/constants";
import { FindCourseOpenDto } from "./dto/find-course-open.dto";
import { CreateCourseOpenDto } from "./dto/create-course-open.dto";
import { DeleteCourseOpenDto } from "./dto/delete-course-open.dto";
import { CloseCurrentStateDto } from "./dto/close-current-state.dto";

@Controller(END_POINTS.COURSE_OPEN.BASE)
export class CourseOpenController {
  constructor(private readonly courseOpenService: CourseOpenService) {}

  @Post(END_POINTS.COURSE_OPEN.CREATE)
  create(@Body() createCourseOpenDto: CreateCourseOpenDto) {
    return this.courseOpenService.create(createCourseOpenDto);
  }

  @Patch(END_POINTS.COURSE_OPEN.UPDATE)
  closeCurrentState(@Param() closeCurrentStateDto: CloseCurrentStateDto) {
    return this.courseOpenService.closeCurrentState(closeCurrentStateDto);
  }

  @Get(END_POINTS.COURSE_OPEN.GET_ALL_ONE_TERM)
  findAllOneTerm(@Query() findCourseOpenDto: FindCourseOpenDto) {
    return this.courseOpenService.findAllOneTerm(findCourseOpenDto);
  }

  @Post(END_POINTS.COURSE_OPEN.DELETE)
  delete(@Body() deleteCourseOpenDto: DeleteCourseOpenDto) {
    return this.courseOpenService.delete(deleteCourseOpenDto);
  }
}
