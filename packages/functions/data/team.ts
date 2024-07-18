import { Entity } from "electrodb";
import crypto from "crypto";
import { Table } from "sst/node/table";
import { client } from "./dynamo";

export const Team = new Entity(
	{
		model: {
			entity: "team",
			version: "1",
			service: "pms",
		},
		attributes: {
			teamId: {
				type: "string",
				readOnly: true,
				required: true,
				default: () => crypto.randomUUID(),
			},
			name: {
				type: "string",
				required: true,
			},
			projectId: {
				type: "string",
				required: true,
			},
			createdAt: {
				type: "string",
				readOnly: true,
				required: true,
				default: () => new Date().toISOString(),
			},
		},
		indexes: {
			primary: {
				pk: {
					field: "pk",
					composite: ["teamId"],
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
					composite: ["teamId"],
				},
			},
		},
	},
	{
		table: Table.pmsTable.tableName,
		client,
	}
);
