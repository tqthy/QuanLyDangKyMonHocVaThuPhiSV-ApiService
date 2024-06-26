import { integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { roleEnum } from "./enums";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { department } from "./department";

export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  hashedPassword: varchar("hashed_password", { length: 100 }).notNull(),
  role: roleEnum("role").notNull(),
  departmentId: integer("department_id"),
});
export type userInsertType = typeof user.$inferInsert;
export type userSelectType = typeof user.$inferSelect;
export const userRelations = relations(user, ({ one }) => ({
  department: one(department, {
    fields: [user.departmentId],
    references: [department.id],
  }),
}));

export type SelectUser = InferSelectModel<typeof user>;
export type InsertUser = InferInsertModel<typeof user>;
