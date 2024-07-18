import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import middy from '@middy/core';
import { errorHandler } from "../util/errorHandler";
import { getUser } from "../../data/user";

export const handler: APIGatewayProxyHandler = middy(
  async (event: APIGatewayProxyEvent) => {
    try {
      const users = await getUser();
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(users),
      };
    } catch (error) {
      console.error('Error in lambda handler:', error);
      throw error; // This will be caught by the errorHandler middleware
    }
  }
).use(errorHandler());