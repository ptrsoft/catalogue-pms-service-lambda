import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import middy from "@middy/core";
import { getWorkflow } from "../../data/workflow";

export const getWorkflowById: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const workflowId = event.pathParameters?.id ?? null;
		if (!workflowId) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "id required",
				}),
			};
		}
		const workflow = await getWorkflow(workflowId);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(workflow),
		};
	}
);
