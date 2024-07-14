export const handler = async (event) => {
	const { flag } = event.payload;
	if (flag === "new") {
		const { usecase_id, flag, project_id } = event.payload || event.Payload;
		const { stateName } = event;
		return {
			flag,
			usecase_id,
			project_id,
			stateName,
		};
	} else if (flag === "Update") {
		const { taskArray, flag, usecase_id, project_id } = event.payload;
		return {
			flag,
			taskArray,
			usecase_id,
			project_id,
		};
	}
};
