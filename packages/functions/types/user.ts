import { z } from "zod";
// import { dateRegex } from "./common";

// You might want to define regex patterns for email, phone, etc.
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const UserRequestSchema = z.object({
	name: z.string().min(2, {
		message: "User name must be at least 2 characters long",
	}),
	email: z.string().regex(emailRegex, {
		message: "Invalid email format",
	}),
	role: z.string().min(2, {
		message: "Role must be at least 2 characters long",
	}),
	password: z
		.string()
		.refine(
			(val) =>
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
					val
				),
			{
				message:
					"Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
			}
		),
	//   phone: z.string().regex(phoneRegex, {
	//     message: "Invalid phone number format",
	//   }).optional(),
	//   department: z.string().optional(),
});

export type UserRequest = z.infer<typeof UserRequestSchema>;

export interface UserResponse {
	userId: string;
	name: string;
	email: string;
	role: string;
	password: string;

	//   phone?: string;
	//   department?: string;
	//   createdAt: string;
}

// update schema

export const UserUpdateRequestSchema = z.object({
	name: z.string().min(2).optional(),
	role: z.string().min(2).optional(),
});

export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;
