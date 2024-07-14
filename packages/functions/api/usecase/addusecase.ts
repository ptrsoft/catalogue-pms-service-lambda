import middy from "@middy/core";
import { errorHandler } from "../util/errorHandler";
import { bodyValidator } from "../util/bodyValidator";
import {
	SFNClient,
	StartExecutionCommand,
	DescribeStateMachineCommand,
} from "@aws-sdk/client-sfn";

import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import {
	NewUsecaseRequest,
	NewUsecaseRequestSchema,
} from "../../types/usecase";
import { addUsecase, getUsecaseByNameInWorkflow } from "../../data/usecase";
import { getWorkflow } from "../../data/workflow";
import { workerData } from "worker_threads";

const stepFunctionClient = new SFNClient({ region: "us-east-1" });

export const handler: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const {
			projectId,
			usecaseName,
			description,
			workflowId,
			startDate,
			endDate,
		} = JSON.parse(event.body || "{}") as NewUsecaseRequest;
		const usecaseNameWithoutSpaces = usecaseName.replace(/ /g, "_");
		const usecaseId = crypto.randomUUID();
		const newUsecaseName =
			usecaseId.split("-")[4] + "@" + usecaseNameWithoutSpaces;
		const input = {
			stateMachineArn: "",
			name: newUsecaseName,
			input: JSON.stringify({
				flag: "new",
				usecase_id: usecaseId,
				project_id: projectId,
			}),
		};
		const res = await getUsecaseByNameInWorkflow(
			usecaseName,
			projectId,
			workflowId
		);
		if (res.length > 0) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message:
						"usecase with same name already exists in the project",
				}),
			};
		}

		const workflowData = await getWorkflow(workflowId);
		const stages: any = [];
		workflowData!.stages!.forEach((stage) => {
			stages.push({
				stage: stage,
				status: "inprogress",
			});
		});
		input.stateMachineArn = workflowData?.arn as string;
		// const stages = workflowData?.stages as any;
		const command = new StartExecutionCommand(input);
		const response = await stepFunctionClient.send(command);
		if (response.$metadata.httpStatusCode == 200) {
			const newUsecase = await addUsecase({
				usecaseId: usecaseId,
				name: usecaseName,
				arn: workflowData?.arn as string,
				currentStage: workflowData?.stages[0],
				projectId: projectId,
				stages: stages,
				startDate: startDate,
				workflowId: workflowId,
				description: description,
				endDate: endDate,
			});
			return {
				statusCode: 201,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify(newUsecase),
			};
		} else {
			return {
				statusCode: 500,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "internal server error",
				}),
			};
		}
	}
)
	.use(bodyValidator(NewUsecaseRequestSchema))
	.use(errorHandler());

const generateStages = (stages: any) => {
	return stages.map((stage: any) => {
		const stageName = stage.name;
		const checklist = stage.checklist;
		return {
			[stageName]: {
				assignee_id: "",
				assigned_by_id: "",
				updated_by_id: "",
				description: "",
				start_date: "",
				end_date: "",
				checklist: checklist.map((item: any, index: any) => ({
					item_id: index + 1,
					description: item,
					checked: false,
				})),
			},
		};
	});
};
