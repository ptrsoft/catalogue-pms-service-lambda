import { z } from "zod";

export const SignInRequestSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export type SignInRequest = z.infer<typeof SignInRequestSchema>;
