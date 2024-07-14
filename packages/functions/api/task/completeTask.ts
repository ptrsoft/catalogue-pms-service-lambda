import { SFNClient, SendTaskSuccessCommand } from "@aws-sdk/client-sfn";
import middy from "@middy/core";
import { pathParamsValidator } from "../util/pathParamsValidator";
import { errorHandler } from "../util/errorHandler";
import { UUIDSchema } from "../../types/common";
import { getTask, updateTaskStatus } from "../../data/task";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";

const stepFunctionClient = new SFNClient({ region: "us-east-1" });

type UUIDReq = {
	userId: string;
};

export const handler: APIGatewayProxyHandler = middy(
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
	.use(pathParamsValidator(UUIDSchema))
	.use(errorHandler());
