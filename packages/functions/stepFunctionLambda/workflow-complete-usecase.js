import { updateUsecaseStatus } from "../data/usecase";

export const handler = async (event) => {
	const id =
		(event.array && event.array[0] && event.array[0][0]) ||
		(event && event.usecase_id);
	const usecase_id = id;
	try {
		const statusUpdate = await updateUsecaseStatus(usecase_id, "completed");
		return {
			statusCode: 201,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			Payload: "Usecase Completed",
			event: usecase_id,
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
