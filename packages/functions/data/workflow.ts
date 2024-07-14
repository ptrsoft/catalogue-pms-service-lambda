import { Entity } from "electrodb";
import crypto from "crypto";
import { Table } from "sst/node/table";
import { client } from "./dynamo";
import { NewWorkflowRequest, WorkflowResponse } from "../types/workflow";

export const Workflows = new Entity(
	{
		model: {
			entity: "workflow",
			version: "1",
			service: "pms",
		},
		attributes: {
			workflowId: {
				type: "string",
				readOnly: true,
				required: true,
				default: () => crypto.randomUUID(),
			},
			status: {
				type: "string",
				required: true,
				enum: ["inprogress", "completed"],
				default: "inprogress",
			},
			name: {
				type: "string",
				required: true,
			},
			arn: {
				type: "string",
				required: true,
			},
			stages: {
				type: "list",
				items: {
					type: "string",
				},
			},
			projectId: {
				type: "string",
				required: true,
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
				default: () => new Date().toISOString(),
				set: () => new Date().toISOString(),
			},
		},
		indexes: {
			primary: {
				pk: {
					field: "pk",
					composite: ["workflowId"],
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
			byProject: {
				index: "gsi2",
				pk: {
					field: "gsi2pk",
					composite: ["projectId"],
				},
				sk: {
					field: "gsi2sk",
					composite: ["workflowId"],
				},
			},
		},
	},
	{
		table: Table.pmsTable.tableName,
		client,
	}
);

export const getWorkflowByName = async (
	name: string
): Promise<WorkflowResponse[]> => {
	try {
		const res = await Workflows.query.byName({ name }).go();
		return res.data.map((item: any) => ({
			workflowId: item.workflowId,
			status: item.status,
			name: item.name,
			arn: item.arn,
			stages: item.stages,
			projectId: item.projectId,
			createdBy: item.createdBy,
			updatedBy: item.updatedBy,
			createdAt: item.createdAt,
		})) as WorkflowResponse[];
	} catch (err) {
		console.log(JSON.stringify(err.message));
		throw err;
	}
};

export const addWorkflow = async (
	name: string,
	arn: string,
	projectId: string,
	stages: string[]
) => {
	try {
		const res = await Workflows.create({
			name: name,
			arn: arn,
			projectId: projectId,
			stages: stages,
		}).go();
		return res.data;
	} catch (err) {
		console.error("Error adding workflow:", err);
		throw err;
	}
};

export const getWorkflow = async (workflowId: string) => {
	try {
		const res = await Workflows.get({ workflowId }).go();
		return res.data;
	} catch (err) {
		console.error("Error adding workflow:", err);
		throw err;
	}
};
