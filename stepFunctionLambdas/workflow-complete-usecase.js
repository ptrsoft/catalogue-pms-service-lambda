const { Client } = require("pg");
exports.handler = async (event) => {
	console.log("ëvent", event);
	const id =
		(event.array && event.array[0] && event.array[0][0]) ||
		(event && event.usecase_id);
	const usecase_id = id;
	const client = new Client({
		host: "213.210.36.2",
		user: "postgres",
		port: 32193,
		password: "postgres",
		database: "postgres",
	});
	await client.connect();
	try {
		console.log("event", event);
		const queryText =
			`UPDATE usecases_tableSET usecase = jsonb_set(usecase, '{status}', '\"completed\"') WHERE id = $1`;
		await client.query(queryText, [usecase_id]);
		return {
			statusCode: 201,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			Payload: "Usecase Completed",
			event: usecase_id,
		};
	} catch (e) {
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: e,
				errorMessage: e.message,
			}),
		};
	} finally {
		await client.end();
	}
};
