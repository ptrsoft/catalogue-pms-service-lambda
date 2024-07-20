import { CustomAttributeType, Entity } from "electrodb";
import crypto from "crypto";
import { Table } from "sst/node/table";
import { client } from "./dynamo";
import { RoleUsersMap } from "../types/team";
import { getUser, getUsers } from "./user";

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
			projectId: {
				type: "string",
				required: true,
			},
			roleUsers: {
				type: CustomAttributeType<RoleUsersMap>("any"),
				get: (value: any): RoleUsersMap => {
					return value ? JSON.parse(value) : {};
				},
				set: (value: RoleUsersMap): string => {
					return JSON.stringify(value);
				},
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

export const addTeam = async (
	projectId: string,
	teamId?: string,
	roleUserMap?: RoleUsersMap
) => {
	const res = await Team.create({
		projectId,
		teamId: teamId,
		roleUsers: roleUserMap,
	}).go();
	return res.data;
};

export const getTeam = async (projectId: string) => {
	const res = await Team.query
		.byProject({
			projectId: projectId,
		})
		.go();

	const roleUsers: Record<string, Set<string>> | undefined =
		res.data[0].roleUsers;

	if (!roleUsers) {
		return {};
	}
	let newRoleuser: Record<string, Array<any>> = {};
	for (const [role, userSet] of Object.entries(roleUsers)) {
		const updatedUserSet = new Array<any>();
		if (Array.from(userSet).length > 0) {
			for (const userId of userSet) {
				const apiResult = await getUser(userId);
				updatedUserSet.push(apiResult);
			}
		}
		newRoleuser[role] = updatedUserSet;
	}
	delete res.data[0].roleUsers;
	(res.data[0] as { [key: string]: any })["team"] = newRoleuser;
	return res.data;
};

export const updateTeam = async (teamId: string, roleUserMap: RoleUsersMap) => {
	const res = await Team.update({ teamId: teamId })
		.set({ roleUsers: roleUserMap })
		.go();
	return res.data;
};
