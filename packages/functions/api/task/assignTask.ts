import middy from "@middy/core";
import { errorHandler } from "../util/errorHandler";
// import { pathParamsValidator } from "../util/pathParamsValidator";
// import { UUIDSchema } from "../../types/common";
import { updateTaskAssignee } from "../../data/task";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = middy(
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
