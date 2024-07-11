import middy from "@middy/core";
import { errorHandler } from "../util/errorHandler.js";
import { pathParamsValidator } from "../util/pathParamsValidator.js";
import { getProject } from "../../data/project.ts";
import { UUIDSchema } from "../../types/common.ts";

export const handler = middy(async (event, context) => {
	const projectId  = event.pathParameters?.id;
	console.log("projectId", projectId);
	if (!projectId) {
		return {
			statusCode: 400,
			body: JSON.stringify({ message: "project id is required" }),
		};
	}
	const project = await getProject(projectId);

	if (!project) {
		return {
			statusCode: 404,
			body: JSON.stringify({ message: "Project not found" }),
		};
	}

	return {
		statusCode: 200,
		body: JSON.stringify(project),
	};
})
	.use(pathParamsValidator(UUIDSchema))
	.use(errorHandler());
