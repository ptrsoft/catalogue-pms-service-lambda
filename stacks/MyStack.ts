import { StackContext, Api, EventBus } from "sst/constructs";

export function API({ stack }: StackContext) {
	const api = new Api(stack, "api", {
		routes: {
			"POST /project": "packages/functions/project/addProject.handler",
			"POST /workflow": "packages/functions/workflow/addWorkflow.handler",
			"POST /usecase": "packages/functions/usecase/addusecase.handler",
			"POST /resource": "packages/functions/resource/addResource.handler",
			"PUT /task/{id}/complete": "packages/functions/task/completeTask.handler",
		},
	});

	stack.addOutputs({
		ApiEndpoint: api.url,
	});
}
