// import { SFNClient, CreateStateMachineCommand } from "@aws-sdk/client-sfn";
// import { generateStateMachine2 } from "../util/"
// import middy from "@middy/core";
// import { errorHandler } from "../util/errorHandler";
// import { bodyValidator } from "../util/bodyValidator";
// import crypto from "crypto";
// import { addWorkflow, getWorkflowByName } from "../../data/workflow";
// import {
// 	NewWorkflowRequest,
// 	NewWorkflowRequestSchemea,
// } from "../../types/workflow";
// import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";

// const sfnClient = new SFNClient({ region: "us-east-1" });

// export const handler: APIGatewayProxyHandler = middy(
// 	async (event: APIGatewayProxyEvent) => {
// 		// const org_id = event.user["custom:org_id"];
// 		const { name, projectId, stages } = JSON.parse(
// 			event.body || "{}"
// 		) as NewWorkflowRequest;

// 		const random = crypto.randomUUID().split("-")[4];
// 		const workflowName = random + "@" + name.replace(/ /g, "_");

// 		const newStateMachine = generateStateMachine2(stages);
// 		const exists = await getWorkflowByName(name);
// 		if (exists.length > 0)
// 			return {
// 				statusCode: 400,
// 				headers: {
// 					"Access-Control-Allow-Origin": "*",
// 				},
// 				body: JSON.stringify({
// 					message: "workflow with same name already exists",
// 				}),
// 			};
// 		const input = {
// 			name: workflowName,
// 			definition: JSON.stringify(newStateMachine),
// 			roleArn: process.env.LAMBDA_ROLE,
// 		};
// 		const command = new CreateStateMachineCommand(input);
// 		const commandResponse = await sfnClient.send(command);
// 		const newWorkflow: NewWorkflowRequest = {
// 			name: name,
// 			projectId: projectId,
// 			stages: stages,
// 		};
// 		const res = await addWorkflow(
// 			newWorkflow,
// 			commandResponse.stateMachineArn as string
// 		);
// 		return {
// 			statusCode: 200,
// 			headers: {
// 				"Access-Control-Allow-Origin": "*",
// 			},
// 			body: JSON.stringify(res),
// 		};
// 	}
// )
// 	.use(bodyValidator(NewWorkflowRequestSchemea))
// 	.use(errorHandler());
 