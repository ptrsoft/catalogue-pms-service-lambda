import middy from "@middy/core";
import { errorHandler } from "../util/errorHandler";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import {
	getTask,
	getTasksByUsecaseId,
	updateTaskAssignee,
	updateTaskStatus,
} from "../../data/task";
import { SFNClient, SendTaskSuccessCommand } from "@aws-sdk/client-sfn";
import { pathParamsValidator } from "../util/pathParamsValidator";

const stepFunctionClient = new SFNClient({ region: "us-east-1" });

export const getTasks: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const usecaseId = event.pathParameters?.id ?? null;
		if (!usecaseId) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "id is required",
				}),
			};
		}
		const tasks = await getTasksByUsecaseId(usecaseId);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(tasks),
		};
	}
).use(errorHandler());

export const completeTask: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const taskId = event.pathParameters?.id ?? null;
		if (!taskId) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "invalid task",
				}),
			};
		}
		// const { userId } = JSON.parse(event.body || "{}") as UUIDReq;

		const task = await getTask(taskId);
		// if (task?.assigneeId !== userId) {
		// 	return {
		// 		statusCode: 403,
		// 		headers: {
		// 			"Access-Control-Allow-Origin": "*",
		// 		},
		// 		body: JSON.stringify({
		// 			message: "unauthorized request",
		// 		}),
		// 	};
		// }
		const input = {
			output: JSON.stringify(task?.usecaseId),
			taskToken: task?.token,
		};
		const command = new SendTaskSuccessCommand(input);
		const updateResult = await updateTaskStatus(taskId, "completed");
		if (updateResult?.taskId == taskId) {
			await stepFunctionClient.send(command);
		}
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "task completed",
			}),
		};
	}
)
	// .use(pathParamsValidator(UUIDSchema))
	.use(errorHandler());

export const assignTask: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const taskid = event.pathParameters?.taskId ?? null;
		const assigned_to_id = event.pathParameters?.resourceId ?? null;
		if (!taskid || !assigned_to_id) {
			throw new Error("taskid and assigned_to_id are required");
		}
		const updatedTask = await updateTaskAssignee(taskid, assigned_to_id);
		return {
			statusCode: 201,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({ message: "task assigned successfully" }),
		};
	}
)
	// .use(pathParamsValidator(UUIDSchema))
	.use(errorHandler());
