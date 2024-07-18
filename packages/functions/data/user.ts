import { Entity } from "electrodb";
import crypto from "crypto";
import { Table } from "sst/node/table";
import { client } from "./dynamo";

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
			teamId: {
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
				},
				sk: {
					field: "sk",
					composite: [],
				},
			},
			usersByRole: {
				index: "gsi1",
				pk: {
					field: "gsi1pk",
					composite: ["roleId"],
				},
				sk: {
					field: "gsi1sk",
					composite: ["userId"],
				},
			},
			usersByTeam: {
				index: "gsi2",
				pk: {
					field: "gsi2pk",
					composite: ["teamId"],
				},
				sk: {
					field: "gsi2sk",
					// change 3: modified to use roleId instead of role
					composite: ["roleId", "userId"],
				},
			},
		},
	},
	{
		table: Table.pmsTable.tableName,
		client,
	}
);
