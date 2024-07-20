import { Entity } from "electrodb";
import crypto from "crypto";
import { Table } from "sst/node/table";
import { client } from "./dynamo";
import { UsecaseResponse } from "../types/usecase";
import { stat } from "fs";

export const Usecases = new Entity(
	{
		model: {
			entity: "usecase",
			version: "1",
			service: "pms",
		},
		attributes: {
			usecaseId: {
				type: "string",
				readOnly: true,
				required: true,
				default: () => crypto.randomUUID(),
			},
			arn: {
				type: "string",
				required: true,
			},
			name: {
				type: "string",
				required: true,
			},
			stages: {
				type: "any",
			},
			currentStage: {
				type: "string",
				// required: true,
			},
			description: {
				type: "string",
			},
			projectId: {
				type: "string",
				required: true,
			},
			workflowId: {
				type: "string",
				required: true,
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
			assignedTo: {
				type: "string",
			},

			createdBy: {
				type: "string",
			},
			updatedBy: {
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
					composite: ["usecaseId"],
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
					composite: ["projectId", "workflowId"],
				},
			},
			byProject: {
				index: "gsi2",
				collection: "projects",
				pk: {
					field: "gsi2pk",
					composite: ["projectId"],
				},
				sk: {
					field: "gsi2sk",
					composite: [],
				},
			},
			byWorkflow: {
				index: "gsi3",
				pk: {
					field: "gsi3pk",
					composite: ["workflowId"],
				},
				sk: {
					field: "gsi3sk",
					composite: ["usecaseId"],
				},
			},
		},
	},
	{
		table: Table.pmsTable.tableName,
		client,
	}
);

export const getUsecaseByNameInWorkflow = async (
	name: string,
	projectId: string,
	workflowId: string
): Promise<UsecaseResponse[]> => {
	try {
		const res = await Usecases.query
			.byName({ name, projectId: projectId, workflowId: workflowId })
			.go();
		return res.data.map((item: any) => ({
			usecaseId: item.usecaseId,
			arn: item.arn,
			name: item.name,
			description: item?.description,
			projectId: item.projectId,
			workflowId: item.workflowId,
			startDate: item.startDate,
			endDate: item?.endDate,
		})) as UsecaseResponse[];
	} catch (err) {
		throw err;
	}
};

export const getUsecase = async (usecaseId: string) => {
	const res = await Usecases.get({
		usecaseId: usecaseId,
	}).go();
	return res.data;
};

export async function getUsecases() {
	const allItems = await Usecases.find({}).go();
	return allItems.data;
}

export const addUsecase = async (usecase: any) => {
	const res = await Usecases.create({
		usecaseId: usecase.usecaseId,
		name: usecase.name,
		arn: usecase.arn,
		currentStage: usecase.currentStage,
		projectId: usecase.projectId,
		stages: usecase.stages,
		startDate: usecase.startDate,
		workflowId: usecase.workflowId,
		description: usecase.description,
		endDate: usecase.endDate,
	}).go();
	return res.data;
};

export const updateUsecaseStage = async (usecaseId: string, stages: any) => {
	const res = await Usecases.update({
		usecaseId: usecaseId,
	})
		.set({
			stages: stages,
		})
		.go();
};

export const updateUsecaseStatus = async (
	usecaseId: string,
	status: string
) => {
	const res = await Usecases.update({
		usecaseId: usecaseId,
	})
		.set({
			status: status,
		})
		.go();
};

export const usecaseCount = async (workflowId: string, status?: string) => {
	let query = Usecases.query.byWorkflow({ workflowId });
	if (status) {
		query.where((attr, op) => `${op.eq(attr.status, status)}`);
	}
	const res = await query.go();
	console.log("<---->", res.data.length);
	return res.data.length;
};
