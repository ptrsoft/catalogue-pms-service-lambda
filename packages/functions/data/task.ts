import { Entity } from "electrodb";
import crypto from "crypto";
import { Table } from "sst/node/table";
import { client } from "./dynamo";

export const Tasks = new Entity(
	{
		model: {
			entity: "task",
			version: "1",
			service: "pms",
		},
		attributes: {
			taskId: {
				type: "string",
				readOnly: true,
				required: true,
				default: () => crypto.randomUUID(),
			},
			arn: {
				type: "string",
				required: true,
			},
			token: {
				type: "string",
				required: true,
			},
			projectId: {
				type: "string",
				required: true,
			},
			usecaseId: {
				type: "string",
				required: true,
			},
			assigneeId: {
				type: "string",
			},
			name: {
				type: "string",
				required: true,
			},
			stage: {
				type: "string",
				required: true,
			},
			createdDate: {
				type: "string",
				required: true,
				default: () => new Date().toISOString().split("T")[0],
			},
			startDate: {
				type: "string",
			},
			endDate: {
				type: "string",
			},
			resourceStartDate: {
				type: "string",
			},
			resourceEndDate: {
				type: "string",
			},
			taskAssignedDate: {
				type: "string",
			},
			assignedByyId: {
				type: "string",
			},
			status: {
				type: "string",
				required: true,
				enum: ["inprogress", "completed", "pending"],
				default: "inprogress",
			},
		},
		indexes: {
			primary: {
				pk: {
					field: "pk",
					composite: ["taskId"],
				},
				sk: {
					field: "sk",
					composite: [],
				},
			},
			byProject: {
				index: "gsi1",
				pk: {
					field: "gsi1pk",
					composite: ["projectId"],
				},
				sk: {
					field: "gsi1sk",
					composite: ["taskId"],
				},
			},
			byUsecase: {
				index: "gsi2",
				pk: {
					field: "gsi2pk",
					composite: ["usecaseId"],
				},
				sk: {
					field: "gsi2sk",
					composite: ["taskId"],
				},
			},
			byAssignee: {
				index: "gsi3",
				pk: {
					field: "gsi3pk",
					composite: ["assigneeId"],
				},
				sk: {
					field: "gsi3sk",
					composite: ["taskId"],
				},
			},
			// tasksByStatus: {
			// 	index: 'gsi4',
			// 	pk: {
			// 	  field: 'gsi1pk',
			// 	  composite: ['status']
			// 	},
			// 	sk: {
			// 	  field: 'gsi4sk',
			// 	  composite: ['taskId']
			// 	}
			//   },
		},
	},
	{
		table: Table.pmsTable.tableName,
		client,
	}
);

//create add task function using create method
export const addTask = async (task: any) => {
	try {
		const result = await Tasks.create({
			...task,
		}).go();
		return result.data;
	} catch (err) {
		console.log(err.message);
	}
};

export const updateTaskAssignee = async (
	taskId: string,
	assigneeId: string
) => {
	try {
		return await Tasks.update({ taskId })
			.set({
				assigneeId,
				taskAssignedDate: new Date().toISOString(),
			})
			.go();
	} catch (err) {
		console.log(err.message);
	}
};

//write func to get all templates from the db without any filters
export const getTasks = async () => {
	try {
		const allItems = await Tasks.find({}).go();
		return allItems.data;
	} catch (err) {
		console.log(err.message);
	}
};

export const getTasksByUsecaseId = async (usecaseId: string) => {
	try {
		const allItems = await Tasks.query
			.byUsecase({
				usecaseId: usecaseId,
			})
			.go();
		return allItems.data;
	} catch (err) {
		console.log(err.message);
	}
};

export const getTask = async (taskId: string) => {
	try {
		const res = await Tasks.get({
			taskId: taskId,
		}).go();
		return res.data;
	} catch (err) {
		console.log(err.message);
	}
};

export const updateTaskStatus = async (taskId: string, status: string) => {
	try {
		const res = await Tasks.update({ taskId: taskId })
			.set({ status: status })
			.go();
		return res.data;
	} catch (err) {
		console.log(err.message);
	}
};

export const getTasksByStatus  = async ( status: string) => {
	try {
		const res = await Tasks.get({ 
			status: status
		 })
		.go();
		return res.data;
	} catch (err) {
		console.log(err.message);
	}
};