import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { errorHandler } from "../util/errorHandler";
import middy from "@middy/core";
import { getTasksByStatus } from "../../data/task";

export const handler: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		let status = "pending";
		const queryStatus = event.queryStringParameters?.status;
		if (queryStatus === "completed") {
			status = "completed";
		  } else if (queryStatus && queryStatus !== "pending") {
			console.log(`Invalid status provided: ${queryStatus}. Defaulting to 'pending'.`);
		  }
		  console.log(`Fetching tasks with status: ${status}`);

		const tasks = await getTasksByStatus(queryStatus);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(tasks),
		};
	}
)
	.use(errorHandler());
