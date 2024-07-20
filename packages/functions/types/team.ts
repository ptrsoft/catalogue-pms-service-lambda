import { z } from "zod";

export const RoleUsersMapSchema = z.record(
	z.string(),
	z.set(z.string().min(1))
);

export type RoleUsersMap = z.infer<typeof RoleUsersMapSchema>;
