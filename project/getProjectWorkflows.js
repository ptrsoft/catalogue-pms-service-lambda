const { connectToDatabase } = require("../db/dbConnector")
const middy = require("@middy/core")
const { z } = require("zod")
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")
const { pathParamsValidator } = require("../util/pathParamsValidator")
const idSchema = z.object({
	id: z.string().uuid({ message: "Invalid project id" }),
})
const usecasesQuery = `
                SELECT
                     w.id,
                     w.name AS workflow_name,
                     COUNT(DISTINCT u.id) AS total_usecases,
                     COUNT(u.id) FILTER (WHERE (u.usecase->> 'status') = 'completed') AS completed_usecases,
                     COUNT(t.id) AS total_tasks,
                     COUNT(t.id) FILTER (WHERE (t.task ->> 'status') = 'completed') AS task_completed
                FROM workflows_table w
                LEFT JOIN usecases_table u ON w.id = u.workflow_id
                LEFT JOIN tasks_table t ON u.id = t.usecase_id
                WHERE w.project_id = $1
                GROUP BY u.workflow_id, w.name, w.id
                 `
exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const project_id = event.pathParameters?.id ?? null
	const client = await connectToDatabase()
	const usecasesResult = await client.query(usecasesQuery, [project_id])
	const workflows = usecasesResult.rows.map(row => ({
		workflow_id: row.id,
		workflow_name: row.workflow_name.split("@")[1].replace(/_/g, " "),
		total_usecases: parseInt(row.total_usecases) || 0,
		task_completed:
			calculatePercentage(row.total_tasks, row.task_completed) || 0,
		completed_usecases: parseInt(row.completed_usecases) || 0,
	}))
	await client.end()
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		},
		body: JSON.stringify(workflows),
	}
})
	.use(authorize())
	.use(pathParamsValidator(idSchema))
	.use(errorHandler())

function calculatePercentage(total, completed) {
	return total === 0 ? 0 : (completed / total) * 100
}
