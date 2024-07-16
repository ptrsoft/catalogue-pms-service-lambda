import { Table } from "sst/node/table";
import { Entity } from "electrodb";
import { client } from "./dynamo";
import crypto from "crypto";
import { ProjectRequest, ProjectResponse } from "../types/project";

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
		},
	},
	{
		table: Table.pmsTable.tableName,
		client,
	}
);

export const getProject = async (projectId: string) => {
	const res = await Project.get({
		projectId: projectId,
	}).go();
	return res.data;
};

export const addProject = async (project: ProjectRequest) => {
	const res = await Project.create({
		name: project.name,
		description: project.description,
		startDate: project.startDate,
		endDate: project?.endDate,
	}).go();
	return res.data;
};

export const getProjectByName = async (
	name: string
): Promise<ProjectResponse[]> => {
	try {
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
	} catch (err) {
		console.log(JSON.stringify(err.message));
		throw err;
	}
};

export const getUserByProject = async (projectId: string) => {
	const res = await Project.get({
		projectId: projectId,
	}).go();
	return res.data;
};