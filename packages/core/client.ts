import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Client } from "pg";

dotenv.config();

// const client = new Client({
// 	connectionString: process.env.DATABASE_URL,
// });
// client.connect();

// export const db = drizzle(client, {
// 	schema: schema,
// });
export const postgresClient = async () => {
	const connectionString = await fetchDBSecret();
	const client = new Client({
		connectionString:
			"postgres://postgres:postgres@213.210.36.2:32193/postgres",
	});
	client.connect();
	const db = drizzle(client, {
		schema,
	});

	return {
		client: client,
		drizzle: db,
	};
};

export async function fetchDBSecret(): Promise<string> {
	const { HOST, PORT, USER, PASSOWRD, DATABASE } = process.env;

	if (!HOST || !PORT || !USER || !PASSOWRD || !DATABASE) {
		throw new Error("Missing required environment variables");
	}
	const str = `postgres://${USER}:${PASSOWRD}@${HOST}:${PORT}/${DATABASE}`;
	return str;
}
