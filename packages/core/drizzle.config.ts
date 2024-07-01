// export default {
// 	schema: "./drizzle/schema.ts",
// 	out: "./drizzle/migrations",
// 	driver: "pg",
// };
import * as dotenv from "dotenv";
dotenv.config();

import { defineConfig } from "drizzle-kit";
const { HOST, PORT, USER, PASSOWRD, DATABASE } = process.env;
const URL = `postgres://${USER}:${PASSOWRD}@${HOST}:${PORT}/${DATABASE}`;
console.log(JSON.stringify(URL));

export default defineConfig({
	schema: "./schema.ts",
	out: "./migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: URL,
	},
});
