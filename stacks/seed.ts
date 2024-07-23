import { Templates } from "../packages/functions/data/template";
export async function seed() {
	await seedData();
}

async function seedData() {
	console.log("START");
	const stepFunctions = JSON.parse(process.env.STEP_FUNCTIONS as string);
	console.log(JSON.stringify(stepFunctions));
	for (const sf of stepFunctions) {
		const existing = await Templates.query.byName({ name: sf.name }).go();
		if (existing.data.length === 0) {
			const res = await Templates.create({
				name: sf.name,
				arn: sf.arn,
			}).go();
			console.log("res", JSON.stringify(res));
			console.log("END");
		} else {
			console.log(`Skipped existing: ${sf.name}`);
		}
	}
}
