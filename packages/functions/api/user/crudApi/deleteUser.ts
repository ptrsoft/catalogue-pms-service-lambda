import middy from "@middy/core";
import { errorHandler } from "../../util/errorHandler";
import { bodyValidator } from "../../util/bodyValidator";
import { UserUpdateRequestSchema } from "../../../types/user";
import { deleteUser } from "../../../data/user";
import { UserUpdateRequest } from "../../../types/user";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = middy(
  async (event: APIGatewayProxyEvent) => {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "userId is required in the path" }),
      };
    }

    // const { name, role } = JSON.parse(event.body || "{}") as UserUpdateRequest;


    // const userUpdate: UserUpdateRequest = {
    //    userId,

    // };

    // console.log("Updating user:", userUpdate);
      const updatedUser = await deleteUser();
      console.log("Updated user:", updatedUser);
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