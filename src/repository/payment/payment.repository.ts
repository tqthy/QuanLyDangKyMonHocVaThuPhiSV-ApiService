import {
  courseRegistration,
  student,
  tuition,
  tuitionPayment,
} from "@db/schema";
import { CreatePaymentDto } from "@module/payment/dto/create-payment-dto";
import { FindPaymentDto } from "@module/payment/dto/find-payment.dto";
import { FindTuitionDto } from "@module/payment/dto/find-tuition.dto";
import { GetStudentTuitionDetailDto } from "@module/payment/dto/get-student-tuition-detail.dto";
import { Inject, Injectable } from "@nestjs/common";
import { Drizzle } from "@type/drizzle.type";
import { and, eq, gte, like, sql, sum } from "drizzle-orm";

@Injectable()
export class PaymentRepository {
  constructor(@Inject("DRIZZLE") private drizzle: Drizzle) {}

  createPayment(createPaymentDto: CreatePaymentDto) {
    const data = {
      tuitionId: createPaymentDto.tuitionId,
      amount: createPaymentDto.amount,
      paymentDate: new Date().toLocaleDateString(),
    };

    return this.drizzle.insert(tuitionPayment).values(data).returning();
  }
  async getStudentTuitionDetail(
    getStudentTuitionDetailDto: GetStudentTuitionDetailDto,
  ) {
    const conditions = [
      eq(courseRegistration.year, getStudentTuitionDetailDto.year),
      eq(courseRegistration.term, getStudentTuitionDetailDto.term),
      eq(student.id, getStudentTuitionDetailDto.studentId),
    ];

    const result = await this.drizzle
      .select({
        id: tuition.id,
        totalPaid: sum(tuitionPayment.amount),
        studentId: student.id,
        studentName: student.name,
        totalRegister: tuition.totalRegisterAmount,
        totalActual: tuition.totalActualAmount,
      })
      .from(student)
      .leftJoin(
        courseRegistration,
        eq(student.id, courseRegistration.studentId),
      )
      .leftJoin(
        tuition,
        eq(courseRegistration.id, tuition.courseRegistrationId),
      )
      .leftJoin(tuitionPayment, eq(tuition.id, tuitionPayment.tuitionId))
      .where(and(...conditions))
      .groupBy(
        tuition.id,
        student.id,
        student.name,
        tuition.totalRegisterAmount,
        tuition.totalActualAmount,
      );

    if (result.length === 0) {
      return null;
    }

    const convertedResult = result.map((record) => ({
      ...record,
      totalPaid: Number(record.totalPaid),
    }));

    return convertedResult[0];
  }

  async findPayment(findPaymentDto: FindPaymentDto) {
    const conditions = [
      eq(courseRegistration.year, findPaymentDto.year),
      eq(courseRegistration.term, findPaymentDto.term),
    ];

    if (findPaymentDto.studentName) {
      conditions.push(like(student.name, `%${findPaymentDto.studentName}%`));
    }
    return await this.drizzle
      .select({
        id: tuitionPayment.id,
        amount: tuitionPayment.amount,
        paymentDate: tuitionPayment.paymentDate,
        year: courseRegistration.year,
        term: courseRegistration.term,
        studentId: student.id,
        studentName: student.name,
      })
      .from(tuitionPayment)
      .innerJoin(tuition, eq(tuitionPayment.tuitionId, tuition.id))
      .innerJoin(
        courseRegistration,
        eq(tuition.courseRegistrationId, courseRegistration.id),
      )
      .innerJoin(student, eq(courseRegistration.studentId, student.id))
      .where(and(...conditions));
  }

  async findTuition(findTuitionDto: FindTuitionDto) {
    if (findTuitionDto.status === "ALL") {
      return await this.findAllTuition(findTuitionDto);
    } else if (findTuitionDto.status === "PAID") {
      return await this.findPaidTuition(findTuitionDto);
    } else if (findTuitionDto.status === "PENDING") {
      return await this.findPendingTuition(findTuitionDto);
    }
  }

  async findAllTuition(findTuitionDto: FindTuitionDto) {
    const conditions = [
      eq(courseRegistration.year, findTuitionDto.year),
      eq(courseRegistration.term, findTuitionDto.term),
    ];

    if (findTuitionDto.studentName) {
      conditions.push(like(student.name, `%${findTuitionDto.studentName}%`));
    }

    const result = await this.drizzle
      .select({
        id: tuition.id,
        totalPaid: sum(tuitionPayment.amount),
        studentId: student.id,
        studentName: student.name,
        totalRegister: tuition.totalRegisterAmount,
        totalActual: tuition.totalActualAmount,
      })
      .from(student)
      .leftJoin(
        courseRegistration,
        eq(student.id, courseRegistration.studentId),
      )
      .leftJoin(
        tuition,
        eq(courseRegistration.id, tuition.courseRegistrationId),
      )
      .leftJoin(tuitionPayment, eq(tuition.id, tuitionPayment.tuitionId))
      .where(and(...conditions))
      .groupBy(
        tuition.id,
        student.id,
        student.name,
        tuition.totalRegisterAmount,
        tuition.totalActualAmount,
      );
    if (result.length === 0) {
      return null;
    }
    const convertedResult = result.map((record) => ({
      ...record,
      totalPaid: Number(record.totalPaid),
    }));

    return convertedResult;
  }

  async findPaidTuition(findTuitionDto: FindTuitionDto) {
    const conditions = [
      eq(courseRegistration.year, findTuitionDto.year),
      eq(courseRegistration.term, findTuitionDto.term),
    ];

    if (findTuitionDto.studentName) {
      conditions.push(like(student.name, `%${findTuitionDto.studentName}%`));
    }
    const result = await this.drizzle
      .select({
        id: tuition.id,
        totalPaid: sum(tuitionPayment.amount),
        studentId: student.id,
        studentName: student.name,
        totalRegister: tuition.totalRegisterAmount,
        totalActual: tuition.totalActualAmount,
      })
      .from(student)
      .leftJoin(
        courseRegistration,
        eq(student.id, courseRegistration.studentId),
      )
      .leftJoin(
        tuition,
        eq(courseRegistration.id, tuition.courseRegistrationId),
      )
      .leftJoin(tuitionPayment, eq(tuition.id, tuitionPayment.tuitionId))
      .where(and(...conditions))
      .groupBy(
        tuition.id,
        student.id,
        student.name,
        tuition.totalRegisterAmount,
        tuition.totalActualAmount,
      )
      .having(({ totalPaid }) => gte(totalPaid, tuition.totalActualAmount));
    if (result.length === 0) {
      return null;
    }
    const convertedResult = result.map((record) => ({
      ...record,
      totalPaid: Number(record.totalPaid),
    }));

    return convertedResult;
  }

  async findPendingTuition(findTuitionDto: FindTuitionDto) {
    const conditions = [
      eq(courseRegistration.year, findTuitionDto.year),
      eq(courseRegistration.term, findTuitionDto.term),
    ];

    if (findTuitionDto.studentName) {
      conditions.push(like(student.name, `%${findTuitionDto.studentName}%`));
    }
    const result = await this.drizzle
      .select({
        id: tuition.id,
        totalPaid: sum(tuitionPayment.amount),
        studentId: student.id,
        studentName: student.name,
        totalRegister: tuition.totalRegisterAmount,
        totalActual: tuition.totalActualAmount,
      })
      .from(student)
      .leftJoin(
        courseRegistration,
        eq(student.id, courseRegistration.studentId),
      )
      .leftJoin(
        tuition,
        eq(courseRegistration.id, tuition.courseRegistrationId),
      )
      .leftJoin(tuitionPayment, eq(tuition.id, tuitionPayment.tuitionId))
      .where(and(...conditions))
      .groupBy(
        tuition.id,
        student.id,
        student.name,
        tuition.totalRegisterAmount,
        tuition.totalActualAmount,
      )
      .having(
        sql`sum(${tuitionPayment.amount}) is null or sum(${tuitionPayment.amount}) < ${tuition.totalActualAmount}`,
      );
    if (result.length === 0) {
      return null;
    }
    const convertedResult = result.map((record) => ({
      ...record,
      totalPaid: Number(record.totalPaid),
    }));

    return convertedResult;
  }
}
