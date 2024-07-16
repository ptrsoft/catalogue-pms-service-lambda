import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { pathParamsValidator } from "../util/pathParamsValidator";
import { errorHandler } from "../util/errorHandler";
// import { UUIDSchema } from "../../types/common";
import middy from "@middy/core";
import { getUserByProject } from "../../data/project";

export const handler: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const projectId = event.pathParameters?.projectId ?? null;
        console.log(projectId)
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

		const listUserbyprojectid = await getUserByProject(projectId);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(listUserbyprojectid),
		};
	}
)
	// .use(pathParamsValidator(UUIDSchema))
	.use(errorHandler());
