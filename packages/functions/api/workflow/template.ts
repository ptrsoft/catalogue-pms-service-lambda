import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { errorHandler } from "../util/errorHandler";
import middy from "@middy/core";
import { addWorkflow } from "../../data/workflow";
import {
	deleteTemplate,
	getTemplateById,
	getTemplates,
} from "../../data/template";
import { SFNClient, DescribeStateMachineCommand } from "@aws-sdk/client-sfn";

const stepFunctionClient = new SFNClient({ region: "us-east-1" });

export const addTemplate: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const { projectId, templateId } = JSON.parse(event.body || "{}");
		if (!projectId) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "projectId is required",
				}),
			};
		}

		const template = await getTemplateById(templateId);
		const describeStateMachineCommand = new DescribeStateMachineCommand({
			stateMachineArn: template!.arn,
		});
		const describeStateMachineCommandresponse =
			await stepFunctionClient.send(describeStateMachineCommand);
		const def = JSON.parse(
			describeStateMachineCommandresponse.definition as any
		);
		const statesArr = Object.keys(def.States);
		const stages: string[] = [];
		for (let i = 0; i < statesArr.length - 1; i = i + 3) {
			stages.push(statesArr[i]);
		}
		const res = await addWorkflow(
			template!.name,
			template!.arn,
			projectId,
			stages
		);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(res),
		};
	}
)
	// .use(pathParamsValidator(UUIDSchema))
	.use(errorHandler());

export const delTemplate: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const templateId = event.pathParameters?.id as string;
		const templates = await deleteTemplate(templateId);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(templates),
		};
	}
).use(errorHandler());

export const getAll: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const templates = await getTemplates();
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(templates),
		};
	}
).use(errorHandler());
