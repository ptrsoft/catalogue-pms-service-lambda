import { projects } from "../../core/schema";

const middy = require("@middy/core");
const { z } = require("zod");
const { errorHandler } = require("../util/errorHandler");
const { bodyValidator } = require("../util/bodyValidator");
const { eq, sql, count } = require("drizzle-orm");
const { postgresClient } = require("../../core/client");

const reqSchema = z.object({
	name: z
		.string()
		.min(3, {
			message: "Project name must be atleast 3 charachters long",
		})
		.regex(/^[^-]*$/, {
			message: "name should not contain `-`",
		}),
	description: z.string(),
	department: z.string(),
	start_date: z.coerce.date(),
	end_date: z.coerce.date(),
});
export const handler = middy(async (event, context) => {
	const { name, description, department, start_date, end_date, image_url } =
		JSON.parse(event.body);
	console.log("BEFORE");
	const db = await postgresClient();

	const isDuplicate = await db.drizzle
		.select({ count: count() })
		.from(projects)
		.where(eq(sql`lower(${projects.name})`, sql`lower(${name})`));
	console.log("After");
	console.log("isDuplicate : ", isDuplicate);
	if (isDuplicate[0].count > 0) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "Project with same name already exists",
			}),
		};
	}
	const result = await db.drizzle
		.insert(projects)
		.values({
			name,
			status: "unassigned",
			description,
			currentStage: "",
			startDate: start_date,
			endDate: end_date,
		})
		.returning();
	await db.client.end();
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify(result[0]),
	};
})
	.use(bodyValidator(reqSchema))
	.use(errorHandler());
