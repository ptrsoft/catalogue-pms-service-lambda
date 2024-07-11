import { z } from "zod";
import { dateRegex } from "./common";


export const ProjectRequestSchema = z.object({
	name: z.string().min(3, {
		message: "project name must be at least 3 characters long",
	}),
	description: z.string(),
	startDate: z
		.string()
		.regex(dateRegex, { message: "Invalid date format. Use YYYY-MM-DD" }),
	endDate: z
		.string()
		.regex(dateRegex, { message: "Invalid date format. Use YYYY-MM-DD" })
		.optional(),
});

export type ProjectRequest = z.infer<typeof ProjectRequestSchema>;

export interface ProjectResponse {
	projectId: string;
	name: string;
	description?: string | undefined;
	status: string;
	startDate: string;
	endDate?: string | undefined;
	createdAt: string;
}
