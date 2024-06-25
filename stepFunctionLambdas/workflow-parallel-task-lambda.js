const { Client } = require("pg");
require("dotenv").config();
exports.handler = async (event, context, callback) => {
	console.log("context :", context)
	console.log("event :", event)
	console.log("enfgv :", process.env)
	const client = new Client({
		host: process.env.HOST,
		user: process.env.USER,
		port: process.env.PORT,
		password: process.env.PASSOWRD,
		database: process.env.DATABASE
	});
	
	if (event.payload.flag == "new") {
		console.log("new")
		await client.connect();
	const { usecase_id, project_id, stateName } = event.payload;
	const { taskName } = event;
	const task = {
		name: taskName,
		stage: stateName,
		created_date: new Date().toISOString().split("T")[0],
		start_date: "",
		end_date: "",
		resource_start_date: "",
		resource_end_date: "",
		task_assigned_date: "",
		assigned_by_id: "",
		status: "inprogress",
	};
	const query = `
			insert into tasks_table
				(arn , token, usecase_id, project_id, task, comments)
			values
				($1, $2, $3::uuid, $4::uuid, $5::jsonb, '[]'::jsonb)
			returning *`;
	try {
		const result = await client.query(query, [
			event.executionArn,
			event.token,
			usecase_id,
			project_id,
			task,
		]);
		return {
			statusCode: 201,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			Payload: result.rows,
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
			})
		};
	}
	} else if (event.payload.flag == "Update") {
		console.log("update")
		const {
		SFNClient,
		SendTaskSuccessCommand,
	} = require("@aws-sdk/client-sfn");
	const sfnClient = new SFNClient({ region: "us-east-1" });
	try{
	const matchingTask = event.payload.taskArray.find(
		(task) => task.task_name === event.taskName
	);
	if (matchingTask && matchingTask.status === "completed") {
		const taskToken = event.token;
		const sendTaskSuccessCommand = new SendTaskSuccessCommand({
			output: "1",
			taskToken: taskToken,
		});
		const successResponse = await sfnClient.send(sendTaskSuccessCommand);
		return {
			statusCode: 200,
			Payload: JSON.stringify({
				response: successResponse,
				message: "Task succeeded successfully",
			}),
		};
	}
	} catch (e) {
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			Payload: JSON.stringify({
				error: e,
			errorMessage: e.message,
			})
		};
	}
	}
};
// const saveToken = async (event, client) => {
// 	const { usecase_id, project_id, stateName } = event.payload;
// 	const { taskName } = event;
// 	const task = {
// 		name: taskName,
// 		stage: stateName,
// 		created_date: new Date().toISOString().split("T")[0],
// 		start_date: "",
// 		end_date: "",
// 		resource_start_date: "",
// 		resource_end_date: "",
// 		task_assigned_date: "",
// 		assigned_by_id: "",
// 		status: "inprogress",
// 	};
// 	const query = `
// 			insert into tasks_table
// 				(arn , token, usecase_id, project_id, task, comments)
// 			values
// 				($1, $2, $3::uuid, $4::uuid, $5::jsonb, '[]'::jsonb)
// 			returning *`;
// 	try {
// 		const result = await client.query(query, [
// 			event.executionArn,
// 			event.token,
// 			usecase_id,
// 			project_id,
// 			task,
// 		]);
// 		return {
// 			statusCode: 201,
// 			headers: {
// 				"Access-Control-Allow-Origin": "*",
// 			},
// 			Payload: result.rows,
// 			event: event,
// 		};
// 	} catch (e) {
// 		return {
// 			statusCode: 500,
// 			headers: {
// 				"Access-Control-Allow-Origin": "*",
// 			},
// 			body: JSON.stringify({
// 				error: e,
// 			errorMessage: e.message,
// 			})
// 		};
// 	}
// };
// const succeedToken = async (event) => {
// 	// return {
// 	// 		statusCode: 500,
// 	// 		headers: {
// 	// 			"Access-Control-Allow-Origin": "*",
// 	// 		},
// 	// 		body: JSON.stringify({
// 	// 			event: event
// 	// 		})
// 	// 	};
// 	const {
// 		SFNClient,
// 		SendTaskSuccessCommand,
// 	} = require("@aws-sdk/client-sfn");
// 	const sfnClient = new SFNClient({ region: "us-east-1" });
// 	try{
// 	// const matchingTask = event.payload.taskArray.find(
// 	// 	(task) => task.task_name === event.taskName
// 	// );
// 	// if (matchingTask && matchingTask.status === "completed") {
// 		const taskToken = event.token;
// 		const sendTaskSuccessCommand = new SendTaskSuccessCommand({
// 			output: "1",
// 			taskToken: taskToken,
// 		});
// 		const successResponse = await sfnClient.send(sendTaskSuccessCommand);
// 		return {
// 			statusCode: 200,
// 			Payload: JSON.stringify({
// 				response: successResponse,
// 				message: "Task succeeded successfully",
// 			}),
// 		};
// 	// }
// 	} catch (e) {
// 		return {
// 			statusCode: 500,
// 			headers: {
// 				"Access-Control-Allow-Origin": "*",
// 			},
// 			Payload: JSON.stringify({
// 				error: e,
// 			errorMessage: e.message,
// 			})
// 		};
// 	}
		
// };