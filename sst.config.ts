import { SSTConfig } from "sst";
import { API } from "./stacks/ApiStack";
import { AuthStack } from "./stacks/AuthStack";

export default {
	config(_input) {
		return {
			name: "pms",
			region: "us-east-1",
		};
	},
	stacks(app) {
		app.stack(AuthStack).stack(API);
	},
} satisfies SSTConfig;
