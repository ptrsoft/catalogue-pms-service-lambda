import { getUsecase, updateUsecaseStage } from "../data/usecase";
export const handler = async (event) => {
	const { flag, project_id, usecase_id, stateName } = event;
	try {
		const result = await getUsecase(usecase_id);
		if (!result) {
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify({ message: "Usecase not found" }),
			};
		}
		const stages = result.stages;
		stages.forEach((stage) => {
			if (stage.stage === stateName) {
				stage.status = "completed";
			}
		});
		await updateUsecaseStage(usecase_id, stages);
		return {
			flag,
			project_id,
			usecase_id,
			stateName,
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
