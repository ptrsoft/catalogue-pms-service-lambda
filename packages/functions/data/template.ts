import { Entity } from "electrodb";
import crypto from "crypto";
import { Table } from "sst/node/table";
import { client } from "./dynamo";

export const Templates = new Entity(
	{
		model: {
			entity: "template",
			version: "1",
			service: "pms",
		},
		attributes: {
			templateId: {
				type: "string",
				readOnly: true,
				required: true,
				default: () => crypto.randomUUID(),
			},
			name: {
				type: "string",
				required: true,
			},
			arn: {
				type: "string",
				required: true,
			},
			description: {
				type: "string",
			},
			image: {
				type: "string",
			},
			all: {
				// Add this attribute
				type: "string",
				default: "all",
			},
		},
		indexes: {
			primary: {
				pk: {
					field: "pk",
					composite: ["templateId"],
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
					composite: ["all"],
				},
			},
		},
	},
	{
		table: Table.pmsTable.tableName,
		client,
	}
);

//write func to add a new template
export async function addTemplate(
	name: string,
	arn: string,
	description?: string,
	image?: string
) {
	const template = await Templates.create({
		name,
		arn,
	}).go();
	return template;
}

//write func to get all templates from the db without any filters
export async function getTemplates() {
	const allItems = await Templates.find({}).go();
	return allItems.data;
}

//func to delete template by id
export async function deleteTemplate(templateId: string) {
	const template = await Templates.delete({ templateId }).go();
	return template;
}

//func to get a single template by id
export async function getTemplateById(templateId: string) {
	const template = await Templates.get({ templateId }).go();
	return template.data;
}
