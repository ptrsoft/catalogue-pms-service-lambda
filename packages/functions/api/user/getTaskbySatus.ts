import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { errorHandler } from "../util/errorHandler";
import middy from "@middy/core";
import { getTasksByStatus  } from "../../data/task";

export const handler: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const status = event.queryStringParameters?.status;

		if (!status) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "usecaseId is required",
				}),
			};
		}

		const tasks = await getTasksByStatus(status);
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
