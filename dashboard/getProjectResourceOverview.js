const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const middy = require("@middy/core");
const { errorHandler } = require("../util/errorHandler");
const { authorize } = require("../util/authorizer");
const { optionalParamsValidator } = require("../util/optionalParamsValidator")


const validStatusValues = ["unassigned", "completed", "inprogress"];
const statusSchema = z
  .object({
    status: z
      .string()
      .nullable()
      .refine((value) => value === null || validStatusValues.includes(value), {
        message: "Invalid status value",
      }),
  })
  .nullable();

exports.handler = middy(async (event, context) => {
  // context.callbackWaitsForEmptyEventLoop = false
  const org_id = event.user["custom:org_id"];

  const status = event.queryStringParameters?.status ?? null;

  const client = await connectToDatabase();
  let query = `
            SELECT 
                p.id AS project_id,
                p.project->>'name' AS project_name,
                (p.project->'team'->'roles') as team
            FROM projects_table AS p
            WHERE
                p.org_id = $1`;
  let queryParams = [];
  queryParams.push(org_id);
  if (status != null) {
    query += `
                AND 
                    (p.project->>'status' = $2)`;
    console.log("query", query);
    queryParams.push(status);
    console.log("queryParams", queryParams);
  }
  const result = await client.query(query, queryParams);
  console.log(result);
  const response = await Promise.all(
    result.rows.map(async ({ project_id, project_name, team }) => {
      let resources = [];
      if (team != null && Array.isArray(team) && team.length > 0) {
        const resourceIds = Array.from(
          new Set(
            team
              .map((e) => Object.values(e))
              .flat()
              .flat()
          )
        );
        console.log(resourceIds);
        const resourceQuery = `
                            SELECT
                                t.id as id,
                                t.task->>'name' as current_task,
								t.task->>'created_date' as created_date,
								t.task->>'end_date' as due_date,
                                ed.designation_id,
                                edg.designation,
                                r.id as resource_id,
                                CONCAT(r.first_name,' ',r.last_name) as resource_name,
                                r.image as image_url,
                                r.work_email as email,
                                r.current_task_id as task_id,
                                COUNT(td.id) AS total_tasks
                            FROM
                                employee r
                            LEFT JOIN 
                                tasks_table t ON r.current_task_id = t.id
							LEFT JOIN 
								tasks_table td ON td.assignee_id = r.id
                            LEFT JOIN 
                                emp_detail ed ON r.id = ed.emp_id
                            LEFT JOIN
                                emp_designation edg ON edg.id = ed.designation_id
                            WHERE 
                                r.id IN (${resourceIds
                                  .map((id, index) => `$${index + 1}`)
                                  .join(", ")})
                            GROUP BY
                                r.id, t.id, ed.designation_id, edg.designation`;
        let ress = await client.query(resourceQuery, resourceIds);
        console.log(ress.rows);
        resources = ress.rows.map(
          ({
            resource_id,
            resource_name,
            image_url,
            email,
            current_task,
            designation,
            created_date,
            due_date,
            total_tasks,
          }) => ({
            resource_id,
            resource_name,
            image_url: image_url || "",
            email,
            current_task,
            designation,
            created_date,
            due_date,
            total_tasks,
          })
        );
      }

      return {
        project_id,
        project_name,
        project_resources: resources != undefined ? resources : [],
      };
    })
  );
  await client.end();
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(response),
  };
})
  .use(authorize())
  .use(optionalParamsValidator(statusSchema))
  .use(errorHandler());
