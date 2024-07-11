import { z } from "zod";
import { dateRegex } from "./common";

export const NewUsecaseRequestSchema = z.object({
	usecaseName: z
		.string()
		.regex(/^[^#%^&*}{;:"><,?\[\]`|@]+$/, {
			message: "name should not contain special symbols",
		})
		.min(3, {
			message: "usecase name should be atleast 3 characters long",
		})
		.max(70, {
			message:
				"usecase name should should be less than 70 characters long",
		}),

	description: z.string(),
	projectId: z.string().uuid({ message: "invalid project id" }),
	workflowId: z.string().uuid({ message: "invalid workflow id" }),
	startDate: z
		.string()
		.regex(dateRegex, { message: "Invalid date format. Use YYYY-MM-DD" }),
	endDate: z
		.string()
		.regex(dateRegex, { message: "Invalid date format. Use YYYY-MM-DD" })
		.optional(),
});

export type NewUsecaseRequest = z.infer<typeof NewUsecaseRequestSchema>;

export interface UsecaseResponse {
	usecaseId: string;
	arn: string;
	name: string;
	description?: string | undefined;
	projectId: string;
	workflowId: string;
	startDate: string;
	endDate?: string | undefined;
}

export interface NewUsecaseParams{}