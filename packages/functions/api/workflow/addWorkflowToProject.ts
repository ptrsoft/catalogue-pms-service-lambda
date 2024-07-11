import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { pathParamsValidator } from "../util/pathParamsValidator";
import { errorHandler } from "../util/errorHandler";
import { UUIDSchema } from "../../types/common";
import middy from "@middy/core";
import { addWorkflow, Workflows } from "../../data/workflow";
import { getTemplateById } from "../../data/template";

export const handler: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const { projectId, templateId } = JSON.parse(event.body || "{}");
		if (!projectId) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "projectId is required",
				}),
			};
		}

		const workflow = await getTemplateById(templateId);
		const res = await addWorkflow(workflow!.name,workflow!.arn, projectId);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(res),
		};
	}
)
	// .use(pathParamsValidator(UUIDSchema))
	.use(errorHandler());
