import middy from "@middy/core";
import { errorHandler } from "../util/errorHandler";
import { bodyValidator } from "../util/bodyValidator";
import {
	UserRequestSchema,
	UserUpdateRequest,
	UserUpdateRequestSchema,
} from "../../types/user";
import { addUser, getUsers, updateUser } from "../../data/user";
import { UserRequest } from "../../types/user";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { getTasksByStatus } from "../../data/task";
import {
	CognitoIdentityProviderClient,
	SignUpCommand,
	AdminDeleteUserCommand,
	SignUpCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
	region: "us-east-1",
});

export const post: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const { name, role, email, password } = JSON.parse(
			event.body || "{}"
		) as UserRequest;
		const user: UserRequest = {
			name,
			role,
			email,
			password,
		};
		// const org_id = uuid()
		const userId = crypto.randomUUID();
		const input = {
			ClientId: process.env.COGNITO_CLIENT,
			Username: email,
			Password: password,
			UserAttributes: [
				// {
				// 	Name: "custom:org_id",
				// 	Value: org_id,
				// },
				{
					Name: "custom:userId",
					Value: userId,
				},
				{
					Name: "custom:role",
					Value: role,
				},
			],
			// DesiredDeliveryMediums: "EMAIL",
			// MessageAction: "RESEND",
		};

		const command = new SignUpCommand(input);
		const signupResponse: SignUpCommandOutput = await cognitoClient.send(
			command
		);
		// const refreshToken =
		// 	signupResponse && signupResponse.

		const newUser = await addUser(user);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(signupResponse),
		};
	}
)
	.use(bodyValidator(UserRequestSchema))
	.use(errorHandler());

export const getAll: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const users = await getUsers();
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(users),
		};
	}
).use(errorHandler());

export const getTaskbySatus: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		let status = "pending";
		const queryStatus = event.queryStringParameters?.status;
		if (queryStatus === "completed") {
			status = "completed";
		} else if (queryStatus && queryStatus !== "pending") {
			console.log(
				`Invalid status provided: ${queryStatus}. Defaulting to 'pending'.`
			);
		}
		console.log(`Fetching tasks with status: ${status}`);

		const tasks = await getTasksByStatus(queryStatus);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(tasks),
		};
	}
).use(errorHandler());

export const update: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const userId = event.pathParameters?.id;
		const userUpdate = JSON.parse(event.body || "{}") as UserUpdateRequest;
		if (!userId) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({
					message: "userId is required in the path",
				}),
			};
		}
		const updatedUser = await updateUser(userId, userUpdate);
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(updatedUser),
		};
	}
)
	.use(bodyValidator(UserUpdateRequestSchema))
	.use(errorHandler());
