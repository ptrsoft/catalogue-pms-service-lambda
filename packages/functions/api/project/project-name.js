import middy from "@middy/core";
import { errorHandler } from "../util/errorHandler.js";
import { pathParamsValidator } from "../util/pathParamsValidator.js";
import { getProjectByName } from "../../data/project";
// import { UUIDSchema } from "../../types/common.ts";

export const handler = middy(async (event, context) => {
	const projectName = event.queryStringParameters?.name;
	if (!projectName) {
		return {
			statusCode: 400,
			body: JSON.stringify({ message: "project name is required" }),
		};
	}
	const project = await getProjectByName(projectName);

	return {
		statusCode: 200,
		body: JSON.stringify(project),
	};
})
	// .use(pathParamsValidator(UUIDSchema))
	.use(errorHandler());
