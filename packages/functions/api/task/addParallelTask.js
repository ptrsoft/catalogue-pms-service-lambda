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
};
