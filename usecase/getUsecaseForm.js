const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const middy = require("@middy/core");
const { authorize } = require("../util/authorizer");
const { errorHandler } = require("../util/errorHandler");
const { pathParamsValidator } = require("../util/pathParamsValidator");

const idSchema = z.object({
  id: z.string().uuid({ message: "Invalid usecase id" }),
});

exports.handler = middy(async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const usecaseId = event.pathParameters?.id ?? null;
  const client = await connectToDatabase();
  const query = `
            SELECT u.usecase,
                   t.id AS id,
                   t.task->>'name' AS task_name,
                   t.task->>'stage' AS stage_name,
                   t.task->>'assign_id' AS assignee_id,
                   t.task->>'description' AS description,
                   t.task->>'start_date' AS task_start_date,
                   t.task->>'end_date' AS task_end_date
              FROM usecases_table u
                   JOIN tasks_table t ON u.id = t.usecase_id
                   JOIN projects_table p ON u.project_id = p.id
             WHERE u.id = $1
        `;

  const jsonData = await client.query(query, [usecaseId]);
  const usecaseData = jsonData.rows[0];
  const stageDetails = usecaseData.usecase.stages.map((stage) => {
    const stageName = Object.keys(stage)[0];
    const stageData = stage[stageName];

    const matchingTaskDetails = jsonData.rows
      .filter((row) => row.stage_name === stageName)
      .map((row) => ({
        id: row.id,
        name: row.task_name,
        assignee_id: row.assignee_id !== null ? row.assignee_id : "",
        start_date: usecaseData.task_start_date,
        end_date: usecaseData.task_end_date,
      }));

    return {
      [stageName]: {
        assignee_id: stageData.assignee_id,
        description: stageData.description,
        start_date: stageData.start_date,
        end_date: stageData.end_date,
        tasks: matchingTaskDetails,
      },
    };
  });
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(stageDetails),
  };
})

  .use(authorize())
  .use(pathParamsValidator(idSchema))
  .use(errorHandler());
