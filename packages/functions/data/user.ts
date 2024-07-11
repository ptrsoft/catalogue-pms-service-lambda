import { Entity } from "electrodb";
import crypto from "crypto";
import { Table } from "sst/node/table";
import { client } from "./dynamo";

// Users Entity
export const Users = new Entity(
	{
		model: {
			entity: "user",
			version: "1",
			service: "pms",
		},
		attributes: {
			userId: {
				type: "string",
				readOnly: true,
				required: true,
				default: () => crypto.randomUUID(),
			},
			name: {
				type: "string",
				required: true,
			},
			role: {
				type: "string",
				required: true,
			},
			createdAt: {
				type: "number",
				readOnly: true,
				required: true,
				default: () => Date.now(),
			},
			updatedAt: {
				type: "number",
				required: true,
				default: () => Date.now(),
				set: () => Date.now(),
			},
		},
		indexes: {
			primary: {
				pk: {
					field: "pk",
					composite: ["userId"],
				},			},
			
			},
			usersByRole: {
				index: "gsi1",
				pk: {
					field: "gsi1pk",
					composite: ["role"],
				},
				sk: {
					field: "gsi1sk",
					composite: ["userId"],
				},
			},
		},
	},
	{
		table: Table.pmsTable.tableName,
		client,
	}
);
