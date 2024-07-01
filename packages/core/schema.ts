import {
	date,
	jsonb,
	pgTable,
	serial,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 50 }),
	role: varchar("role", { length: 50 }),
});

export const projects = pgTable("projects", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 50 }).notNull(),
	description: text("description"),
	status: varchar("status", { length: 20 }),
	currentStage: varchar("current_stage", { length: 100 }),
	startDate: date("start_date"),
	endDate: date("end_date"),
});

export const workflows = pgTable("workflows", {
	id: uuid("id").primaryKey().defaultRandom(),
	metadata: jsonb("metadata"),
	name: varchar("name", { length: 255 }).notNull().unique(),
	arn: varchar("arn", { length: 255 }).notNull(),
	projectId: uuid("project_id").references(() => projects.id),
});

export const usecases = pgTable("usecases", {
	id: uuid("id").primaryKey().defaultRandom(),
	arn: varchar("arn", { length: 255 }).notNull(),
	usecase: jsonb("usecase"),
	projectId: uuid("project_id").references(() => projects.id),
	workflowId: uuid("workflow_id").references(() => workflows.id),
	assigneeId: uuid("assignee_id").references(() => users.id),
});

export const tasks = pgTable("tasks", {
	id: uuid("id").primaryKey().defaultRandom(),
	arn: varchar("arn", { length: 255 }).notNull(),
	task: jsonb("task"),
	token: text("token"),
	projectId: uuid("project_id").references(() => projects.id),
	usecaseId: uuid("usecase_id").references(() => usecases.id),
	assigneeId: uuid("assignee_id").references(() => users.id),
});

export const templates = pgTable("templates", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull().unique(),
	description: text("description").notNull(),
	image: text("image"),
});
