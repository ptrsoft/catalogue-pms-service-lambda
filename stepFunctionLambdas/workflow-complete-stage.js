const { Client } = require('pg');
exports.handler = async (event) => {
    console.log("ëvent",event)
//     const id = event.array[0]
//   const  usecase_id = id;
    const { flag, project_id, usecase_id ,stateName} = event;
    const client = new Client({
        host: "213.210.36.2",
		user: "postgres",
		port: 32193,
		password: "postgres",
		database: "postgres",
    });
    await client.connect();
    try{
          const result = await client.query(
            "SELECT usecase FROM usecases_table WHERE id = $1",
            [usecase_id]
        );
        if (result.rowCount === 0) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({ message: "Usecase not found" }),
            };
        }
        const existingData = result.rows[0].usecase;
        existingData.stages.forEach((stageObj) => {
            const stageKey = Object.keys(stageObj)[0];
            if (stageKey === stateName) {
                const stageData = stageObj[stageKey];
                console.log(stageData);
                stageData.status = "completed";
            }
        });
        await client.query(`  UPDATE usecases_table
                               SET usecase = $1 WHERE id = $2 `,[existingData, usecase_id]);
        return {
		 flag,
		 project_id,
		 usecase_id,
		 stateName
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
		}
    } finally {
        await client.end();
    }
};