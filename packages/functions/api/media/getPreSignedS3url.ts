import middy from "@middy/core";
import { errorHandler } from "../util/errorHandler";
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Bucket } from "sst/node/bucket";
import crypto from "crypto";
import { promisify } from "util";

const randomBytes = promisify(crypto.randomBytes);

const client = new S3Client({ region: "us-east-1" });

export const handler: APIGatewayProxyHandler = middy(
	async (event: APIGatewayProxyEvent) => {
		const rawBytes = await randomBytes(16);
		const imageName = rawBytes.toString("hex");
		const command = new GetObjectCommand({
			Bucket: Bucket.pmsBucket.bucketName,
			Key: imageName,
		});
		const url = await getSignedUrl(client, command, { expiresIn: 1800 });
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				uploadUrl: url,
			}),
		};
	}
).use(errorHandler());
