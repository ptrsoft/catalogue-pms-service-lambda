import { Entity } from "electrodb";
import crypto from "crypto";
import { Table } from "sst/node/table";
import { client } from "./dynamo";
import { UserUpdateRequest, UserResponse, UserRequest } from "../types/user";

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

export const addUser = async (users: UserRequest) => {
	const res = await Users.create({
		name: users.name,
		role: users.role,
	}).go();
	return res.data;
};

export const updateUser = async (
	userId: string,
	userUpdate: UserUpdateRequest
) => {
	const res = await Users.update({
		userId: userId,
	})
		.set(userUpdate)
		.go();
	return res.data;
};

export const getUser = async (userId: string) => {
	const res = await Users.get({ userId }).go();
	return res.data;
};

export const getUsers = async () => {
	const allItems = await Users.find({}).go();
	return allItems.data;
};

// export const getUserByProject = async (projectId: string) => {
// 	const res = await Users.get({
// 		projectId: projectId,
// 	}).go();
// 	return res.data;
// };

export const deleteUser = async (userId: string) => {
	const res = await Users.delete({
		userId: userId,
	}).go();
	return res.data;
};
