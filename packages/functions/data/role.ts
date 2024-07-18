import { Entity } from "electrodb";
import crypto from "crypto";
import { Table } from "sst/node/table";
import { client } from "./dynamo";

export const Role = new Entity(
	{
		model: {
			entity: "role",
			version: "1",
			service: "pms",
		},
		attributes: {
			roleId: {
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
					composite: ["roleId"],
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
