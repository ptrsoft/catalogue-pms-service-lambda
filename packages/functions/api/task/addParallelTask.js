import { addTask } from "../../data/task";

export const handler = async (event, context, callback) => {
	// if (event.payload.flag == "new") {
	await client.connect();
	const { usecase_id, project_id, stateName } = event.payload;
	const { taskName } = event;

	try {
		const task = {
			name: taskName,
			stage: stateName,
			arn: event.executionArn,
			token: event.token,
			usecaseId: usecase_id,
			projectId: project_id,
		};
		const newTask = await addTask(task);
		return {
			statusCode: 201,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			Payload: newTask,
			event: event,
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
	}
	// } else if (event.payload.flag == "Update") {
	// 	console.log("update");
	// 	const {
	// 		SFNClient,
	// 		SendTaskSuccessCommand,
	// 	} = require("@aws-sdk/client-sfn");
	// 	const sfnClient = new SFNClient({ region: "us-east-1" });
	// 	try {
	// 		const matchingTask = event.payload.taskArray.find(
	// 			(task) => task.task_name === event.taskName
	// 		);
	// 		if (matchingTask && matchingTask.status === "completed") {
	// 			const taskToken = event.token;
	// 			const sendTaskSuccessCommand = new SendTaskSuccessCommand({
	// 				output: "1",
	// 				taskToken: taskToken,
	// 			});
	// 			const successResponse = await sfnClient.send(
	// 				sendTaskSuccessCommand
	// 			);
	// 			return {
	// 				statusCode: 200,
	// 				Payload: JSON.stringify({
	// 					response: successResponse,
	// 					message: "Task succeeded successfully",
	// 				}),
	// 			};
	// 		}
	// 	} catch (e) {
	// 		return {
	// 			statusCode: 500,
	// 			headers: {
	// 				"Access-Control-Allow-Origin": "*",
	// 			},
	// 			Payload: JSON.stringify({
	// 				error: e,
	// 				errorMessage: e.message,
	// 			}),
	// 		};
	// 	}
	// }
};
