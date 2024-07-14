import middy from "@middy/core";
import { errorHandler } from "../util/errorHandler";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { getTasks, getTasksByUsecaseId } from "../../data/task";

export const handler: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const { usecaseId } = JSON.parse(event.body || "{}");
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
