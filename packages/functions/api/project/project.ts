import middy from "@middy/core";
import { errorHandler } from "../util/errorHandler";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { getTeam, updateTeam } from "../../data/team";
import { RoleUsersMap } from "../../types/team";
import {
	addProject,
	getProject,
	getProjectByName,
	getProjects,
} from "../../data/project";
import { getWorkflow, getWorkflows } from "../../data/workflow";
import { ProjectRequest, ProjectRequestSchema } from "../../types/project";
import { bodyValidator } from "../util/bodyValidator";

export const post: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const { name, description, startDate, endDate } = JSON.parse(
			event.body || "{}"
		) as ProjectRequest;
		const projectExists = await getProjectByName(name);
		if (projectExists.length > 0) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "Project with same name already exists",
				}),
			};
		}
		const project: ProjectRequest = {
			name,
			description,
			startDate,
			endDate,
		};
		const newProject = await addProject(project);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(newProject),
		};
	}
)
	.use(bodyValidator(ProjectRequestSchema))
	.use(errorHandler());

export const getProjectTeam: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const projectId = event.pathParameters?.id ?? null;
		if (!projectId) {
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
		const projectTeam = await getTeam(projectId);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(projectTeam),
		};
	}
)
	// .use(bodyValidator(ProjectRequestSchema))
	.use(errorHandler());

export const updateProjectTeam: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const teamId = event.pathParameters?.id ?? null;
		const userRoles = JSON.parse(event.body || "{}") as RoleUsersMap;
		if (!teamId) {
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

		const updatedTeam = await updateTeam(teamId, userRoles);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(updatedTeam),
		};
	}
)
	// .use(bodyValidator(ProjectRequestSchema))
	.use(errorHandler());

export const getProjectById: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const projectId = event.pathParameters?.id ?? null;
		if (!projectId) {
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
		const project = await getProject(projectId);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(project),
		};
	}
);

export const getAllProjects: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const cursor = event.queryStringParameters?.cursor ?? undefined;
		const projects = await getProjects(cursor);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(projects),
		};
	}
);

export const getProjectWorkflows: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const cursor = event.queryStringParameters?.cursor ?? undefined;
		const status = event.queryStringParameters?.status ?? undefined;
		const projectId = event.pathParameters?.id ?? null;
		if (!projectId) {
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
		const workflows = await getWorkflows(projectId, status, cursor);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(workflows),
		};
	}
);
