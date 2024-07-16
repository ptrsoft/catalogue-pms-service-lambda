import middy from "@middy/core";
import { errorHandler } from "../../util/errorHandler";
import { bodyValidator } from "../../util/bodyValidator";
import { UserRequestSchema } from "../../../types/user";
import { addUser} from "../../../data/user";
import { UserRequest } from "../../../types/user";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";


export const handler: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const { name, role,} = JSON.parse(
			event.body || "{}"
		) as UserRequest;
		const user: UserRequest = {
			name,
			role
		};
        console.log(user);
        
		const newUser = await addUser(user);
        console.log(newUser)
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify(newUser),
		};
	}
)
	.use(bodyValidator(UserRequestSchema))
	.use(errorHandler());