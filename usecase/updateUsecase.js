const { connectToDatabase } = require("../db/dbConnector");
const { z } = require("zod");
const { generateStateMachine2 } = require("../workflow/generateStateMachine");
const {
  SFNClient,
  UpdateStateMachineCommand,
  StartExecutionCommand,
} = require("@aws-sdk/client-sfn");
const middy = require("@middy/core");
const { authorize } = require("../util/authorizer");
const { errorHandler } = require("../util/errorHandler");
const { pathParamsValidator } = require("../util/pathParamsValidator");
const { bodyValidator } = require("../util/bodyValidator");

const idSchema = z.object({
  id: z.string().uuid({ message: "Invalid employee id" }),
});

const StageSchema = z.object(
    {
      tasks: z.array(z.string()),
      checklist: z.array(z.string()),
    },
    { message: "Invalid request body" }
  );
  const UpdateSchema = z.object({
    name: z.string().min(3, {
      message: "usecase name should be atleast 3 characters long",
    }),
    stages: z.array(z.record(z.string(), StageSchema)),
  });

exports.handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const useCaseId = event.pathParameters?.id;
  const { name, updated_by_id, stages } = JSON.parse(event.body);
  const client = await connectToDatabase();
  const sfnClient = new SFNClient({ region: "us-east-1" });
  const details = await client.query(
    `
                                        SELECT 
                                            (r.resource -> 'name') as name,
		                                    (r.resource -> 'image') as image_url
										FROM 
                                            employee as r
										WHERE
                                            id = $1`,
    [updated_by_id]
  );
  resourcedetails = details.rows[0];
  const useCaseResult = await client.query(
    `
                                        SELECT 
                                            u.workflow_id AS workflow_id,
		                                    u.usecase AS usecase,
											t.id AS task_id,
											(t.task->>'name') AS task_name,
											(t.task->>'status') AS task_status
										FROM 
                                            usecases_table AS u
										JOIN
                                            tasks_table AS t ON u.id = t.usecase_id
										WHERE 
                                        u.id = $1`,
    [useCaseId]
  );

  let resultObject = { workflow_id: "", taskarray: [] };
  console.log(useCaseResult.rows);
  const existingData = useCaseResult.rows[0].usecase;
  existingData.updated_by = {
    id: updated_by_id,
    name: resourcedetails.name,
    image_url: resourcedetails.image_url,
  };
  // console.log("existingdata",existingData);
  if (useCaseResult.rows.length > 0) {
    resultObject.workflow_id = useCaseResult.rows[0].workflow_id;
  }
  const taskArray = useCaseResult.rows.map((row) => ({
    task_id: row.task_id,
    task_name: row.task_name,
    status: row.task_status,
  }));

  // console.log("Workflow ID:", resultObject.workflow_id);
  // console.log("Task Array:", taskArray);
  const stateMachineResult = await client.query(
    "SELECT arn FROM workflows_table WHERE id = $1",
    [resultObject.workflow_id]
  );
  const stateMachineArn = stateMachineResult.rows[0].arn;
  // console.log("stateMachineArn",stateMachineArn);
  const stateMachineDefinition = generateStateMachine2(stages);
  const input = {
    stateMachineArn: stateMachineArn,
    definition: JSON.stringify(stateMachineDefinition),
    roleArn: "arn:aws:iam::657907747545:role/backendstepfunc-Role",
    publish: true,
    versionDescription: "new version",
  };

  const update = await sfnClient.send(new UpdateStateMachineCommand(input));
  console.log("update-state-machine :", update);
  console.log("arn :", update.stateMachineVersionArn);
  let existingname = existingData.name;
  let name1 = name;
  const newname =
    name1 == existingname.split("-")[0]
      ? existingname.replace(/\d+$/, (match) => parseInt(match) + 1)
      : name1 + "-" + existingname.split("-")[1];
  existingData.name = newname;
  console.log("New-Name", newname);
  const startExecutionParams = {
    stateMachineArn: update.stateMachineVersionArn,
    name: newname,
    input: JSON.stringify({
      flag: "Update",
      usecase_id: useCaseId,
      project_id: useCaseId,
      taskArray: taskArray,
    }),
  };
  const startExecutionCommand = new StartExecutionCommand(startExecutionParams);
  const startExecutionResult = await sfnClient.send(startExecutionCommand);
  console.log(startExecutionResult);
  await client.query(
    `update usecases_table set arn = $1 ,usecase = $2 where id = $3`,
    [startExecutionResult.executionArn, existingData, useCaseId]
  );
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({ stages: stages }),
  };
})

  .use(authorize())
  .use(pathParamsValidator(idSchema))
  .use(bodyValidator(UpdateSchema))
  .use(errorHandler());
