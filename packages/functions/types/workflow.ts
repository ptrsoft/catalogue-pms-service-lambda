import { z } from "zod";

export const NewWorkflowRequestSchemea = z.object({
	name: z
		.string()
		.regex(/^[^-]*$/, {
			message: "name should not contain `-`",
		})
		.min(3),
	createdBy: z.string().uuid({ message: "invalid resource id" }).optional(),
	projectId: z.string().uuid({ message: "invalid project id" }),
	stages: z.array(
		z.object({
			name: z
				.string({
					message: "name must be atleast 3 characters",
				})
				.min(3),
			tasks: z.array(z.string()),
			checklist: z.array(z.string()),
		}),
		{ message: "invalid request body" }
	),
});

export type NewWorkflowRequest = z.infer<typeof NewWorkflowRequestSchemea>;

export interface WorkflowResponse {
	workflowId: string;
	status: string;
	name: string;
	arn: string;
	stages: string;
	projectId: string;
	createdBy: string;
	updatedBy: string;
	createdAt: string;
}
