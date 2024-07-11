import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { pathParamsValidator } from "../util/pathParamsValidator";
import { errorHandler } from "../util/errorHandler";
import { UUIDSchema } from "../../types/common";
import middy from "@middy/core";
import { addWorkflow, Workflows } from "../../data/workflow";
import { getTemplateById } from "../../data/template";
import { getUsecase, getUsecases } from "../../data/usecase";

export const handler: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		// const { projectId, templateId } = JSON.parse(event.body || "{}");
		// if (!projectId) {
		// 	return {
		// 		statusCode: 400,
		// 		headers: {
		// 			"Access-Control-Allow-Origin": "*",
		// 		},
		// 		body: JSON.stringify({
		// 			message: "projectId is required",
		// 		}),
		// 	};
		// }

		const usecases = await getUsecases();
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(usecases),
		};
	}
)
	// .use(pathParamsValidator(UUIDSchema))
	.use(errorHandler());
