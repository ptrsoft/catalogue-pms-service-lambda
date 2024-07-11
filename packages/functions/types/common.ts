import { z } from "zod";

export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const UUIDSchema = z.object({
	id: z.string().uuid({ message: "invalid request id" }),
});
