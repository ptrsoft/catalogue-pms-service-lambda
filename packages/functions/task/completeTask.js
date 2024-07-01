const { connectToDatabase } = require("../db/dbConnector");
const { SFNClient, SendTaskSuccessCommand } = require("@aws-sdk/client-sfn");
const { z } = require("zod");
const middy = require("@middy/core");
const { pathParamsValidator } = require("../util/pathParamsValidator");
const { errorHandler } = require("../util/errorHandler");
const { bodyValidator } = require("../util/bodyValidator");

const idSchema = z.object({
	taskId: z.string().uuid({ message: "Invalid task id" }),
});
const userIdSchema = z.object({
	userId: z.string().uuid({ message: "Invalid user id" }),
});

const updateQuery = `
    UPDATE tasks_table
    SET task = jsonb_set(
            task,
            '{status}',
            '"completed"'
        )
    WHERE id = $1`;

const getTokenQuery = `
    SELECT
        token, usecase_id, assignee_id
    FROM
        tasks_table
    WHERE
        id = $1::uuid`;

exports.handler = middy(async (event) => {
	const task_id = event.pathParameters?.taskId ?? null;
	const { user_id } = JSON.parse(event.body);
	const client = await connectToDatabase();
	await client.query("BEGIN");
	try {
		const tokenResult = await client.query(getTokenQuery, [task_id]);
		const { token, usecase_id, assignee_id } = tokenResult.rows[0];
		if (assignee_id !== user_id) {
			return {
				statusCode: 403,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "unauthorized request",
				}),
			};
		}
		const stepFunctionClient = new SFNClient({ region: "us-east-1" });
		const input = {
			output: JSON.stringify(usecase_id),
			taskToken: token,
		};
		const command = new SendTaskSuccessCommand(input);
		const updateResult = await client.query(updateQuery, [task_id]);
		if (updateResult.rowCount > 0) {
			const respone = await stepFunctionClient.send(command);
		}
		await client.query("COMMIT");
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "task completed",
			}),
		};
	} catch (error) {
		await client.query("ROLLBACK");
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: error.message,
				error: error,
			}),
		};
	} finally {
		await client.end();
	}
})
	.use(pathParamsValidator(idSchema))
	.use(bodyValidator(user_id))
	.use(errorHandler());
