import { Table } from "sst/node/table";
import { Entity } from "electrodb";
import { client } from "./dynamo";
import crypto from "crypto";
import { ProjectRequest, ProjectResponse } from "../types/project";
import { addTeam, getTeam, Team } from "./team";
import { RoleUsersMap } from "../types/team";
import { Usecases } from "./usecase";

export const Project = new Entity(
	{
		model: {
			entity: "project",
			version: "1",
			service: "pms",
		},
		attributes: {
			projectId: {
				type: "string",
				readOnly: true,
				required: true,
				default: () => crypto.randomUUID(),
			},
			name: {
				type: "string",
				required: true,
			},
			description: {
				type: "string",
			},
			status: {
				type: "string",
				required: true,
				enum: ["pending", "completed"],
				default: "pending",
			},
			startDate: {
				type: "string",
				required: true,
			},
			endDate: {
				type: "string",
			},
			teamId: {
				type: "string",
			},
			createdAt: {
				type: "string",
				readOnly: true,
				required: true,
				default: () => new Date().toISOString(),
				set: () => new Date().toISOString(),
			},
		},
		indexes: {
			primary: {
				pk: {
					field: "pk",
					composite: ["projectId"],
				},
				sk: {
					field: "sk",
					composite: [],
				},
			},
			byName: {
				index: "gsi1",
				pk: {
					field: "gsi1pk",
					composite: ["name"],
				},
				sk: {
					field: "gsi1sk",
					composite: [],
				},
			},
			byTeam: {
				index: "gsi2",
				pk: {
					field: "gsi2pk",
					composite: ["teamId"],
				},
				sk: {
					field: "gsi2sk",
					composite: ["projectId"],
				},
			},
			allProjects: {
				index: "gsi3",
				pk: {
					field: "gsi3pk",
					composite: [],
				},
				sk: {
					field: "gsi3sk",
					composite: ["createdAt"],
				},
			},
		},
	},
	{
		table: Table.pmsTable.tableName,
		client,
	}
);

export const getProject = async (projectId: string) => {
	const res = await Project.get({ projectId }).go();
	return res.data;
};

export const getProjects = async (
	cursor?: string,
	status: string = "pending"
) => {
	const res = await Project.query
		.allProjects({})
		.where((att, opp) => `${opp.eq(att.status, status)}`)
		.go({
			limit: 3,
			cursor,
		});

	const projectsWithUsecaseCount = await Promise.all(
		res.data.map(async (project) => {
			const usecaseCount = await Usecases.query
				.byProject({ projectId: project.projectId })
				.go();
			let count = usecaseCount.data.length;
			return {
				...project,
				usecaseCount: count,
			};
		})
	);

	const users: any = [];
	const projectUsers = await Promise.all(
		projectsWithUsecaseCount.map(async (project) => {
			const users: any[] = [];
			const usersRes = await getTeam(project.projectId);

			if (usersRes[0]?.team) {
				Object.values(usersRes[0].team).forEach(
					(teamMembers: any[]) => {
						teamMembers.forEach((user) => {
							if (
								user &&
								user.userId &&
								!users.some((x) => x.userId === user.userId)
							) {
								users.push(user);
							}
						});
					}
				);
			}

			return {
				...project,
				team: users,
			};
		})
	);
	return {
		data: projectUsers,
		cursor: res.cursor,
	};
};

export const addProject = async (project: ProjectRequest) => {
	const teamId = crypto.randomUUID();
	const res = await Project.create({
		name: project.name,
		description: project.description,
		startDate: project.startDate,
		endDate: project?.endDate,
		teamId: teamId,
	}).go();
	const roleUserMap: RoleUsersMap = {};
	const roles = [
		"Project Manager",
		"UX Team",
		"UI Team",
		"API Team",
		"DevOps",
		"Testing",
		"Marketing",
	];
	roles.forEach((role) => {
		roleUserMap[role] = new Set<string>();
	});
	await addTeam(res.data.projectId, teamId, roleUserMap);
	return res.data;
};

export const getProjectByName = async (
	name: string
): Promise<ProjectResponse[]> => {
	const res = await Project.query.byName({ name }).go();
	return res.data.map((item: any) => ({
		projectId: item.projectId,
		name: item.name,
		description: item.description,
		status: item.status,
		startDate: item.startDate,
		endDate: item.endDate,
		createdAt: item.createdAt,
	})) as ProjectResponse[];
};
