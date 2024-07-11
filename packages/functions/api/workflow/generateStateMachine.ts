// import * as sfn from "aws-cdk-lib/aws-stepfunctions";
// import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
// import * as lambda from "aws-cdk-lib/aws-lambda";
// import * as sst from "sst/constructs";
// import { Duration } from "aws-cdk-lib";

// export function MyWorkflowStack({ stack }: sst.StackContext) {
// 	// Define Lambda functions
// 	const processLambda = new sst.Function(stack, "ProcessLambda", {
// 		handler: "../stepFunctionLambda/workflow-process-lambda.handler",
// 	});

// 	const parallelTaskLambda = new sst.Function(stack, "ParallelTaskLambda", {
// 		handler: "../stepFunctionLambda/workflow-parallel-task-lambda.handler",
// 	});

// 	const completeStageLambda = new sst.Function(stack, "CompleteStage", {
// 		handler: "../stepFunctionLambda/workflow-complete-stage.handler",
// 	});

// 	const completeUsecaseLambda = new sst.Function(stack, "CompleteUsecase", {
// 		handler: "../stepFunctionLambda/workflow-complete-usecase.handler",
// 	});

// 	// Helper function to create a parallel task
// 	const createParallelTask = (id: string) => {
// 		return new tasks.LambdaInvoke(stack, id, {
// 			lambdaFunction: parallelTaskLambda,
// 			integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
// 			payload: sfn.TaskInput.fromObject({
// 				executionArn: sfn.JsonPath.stringAt("$$.Execution.Id"),
// 				token: sfn.JsonPath.taskToken,
// 				taskName: sfn.JsonPath.stringAt("$$.State.Name"),
// 				payload: sfn.JsonPath.entirePayload,
// 			}),
// 		});
// 	};

// 	// Helper function to create a process task
// 	const createProcessTask = (id: string) => {
// 		return new tasks.LambdaInvoke(stack, id, {
// 			lambdaFunction: processLambda,
// 			resultPath: "$",
// 			payloadResponseOnly: true,
// 			retryOnServiceExceptions: true,
// 		});
// 	};

// 	// Helper function to create a complete stage task
// 	const createCompleteStageTask = (id: string) => {
// 		return new tasks.LambdaInvoke(stack, id, {
// 			lambdaFunction: completeStageLambda,
// 			resultPath: "$",
// 		});
// 	};

// 	// Define states
// 	const sRequirement = createProcessTask("Requirement");

// 	const sRequirementTasks = new sfn.Parallel(stack, "Requirement-tasks", {
// 		resultPath: "$.array",
// 	});

// 	sRequirementTasks.branch(createParallelTask("Create Use Case Document"));
// 	sRequirementTasks.branch(createParallelTask("Create Screen Designs"));
// 	sRequirementTasks.branch(
// 		createParallelTask(
// 			"Perform functional design review with the tech team"
// 		)
// 	);

// 	const sRequirementComplete = createCompleteStageTask(
// 		"Requirement-complete"
// 	);

// 	const sMockDev = createProcessTask("Mock Dev");

// 	const sMockDevTasks = new sfn.Parallel(stack, "Mock Dev-tasks", {
// 		resultPath: "$.array",
// 	});

// 	sMockDevTasks.branch(createParallelTask("Create OpenAPI Specification"));
// 	sMockDevTasks.branch(
// 		createParallelTask("Create Postman Tests for OpenAPI specification")
// 	);
// 	sMockDevTasks.branch(
// 		createParallelTask("Create UI screens working with Mock API")
// 	);
// 	sMockDevTasks.branch(createParallelTask("Create Test Plans"));

// 	const sMockDevComplete = createCompleteStageTask("Mock Dev-complete");

// 	const sActualDev = createProcessTask("Actual Dev");

// 	const sActualDevTasks = new sfn.Parallel(stack, "Actual Dev-tasks", {
// 		resultPath: "$.array",
// 	});

// 	sActualDevTasks.branch(
// 		createParallelTask(
// 			"Create Data Design Page in GitHub as MD file and link it in Netlify site"
// 		)
// 	);
// 	sActualDevTasks.branch(
// 		createParallelTask(
// 			"Create API source Code in GitHub and link it in Netlify site"
// 		)
// 	);
// 	sActualDevTasks.branch(
// 		createParallelTask("Populate Test data or sample data file in GitHub")
// 	);
// 	sActualDevTasks.branch(createParallelTask("Create Junit5 Tests in GitHub"));
// 	sActualDevTasks.branch(
// 		createParallelTask("Create Cucumber BDD tests in GitHub")
// 	);
// 	sActualDevTasks.branch(
// 		createParallelTask("Create Gatling Performance/Load Tests in GitHub")
// 	);
// 	sActualDevTasks.branch(
// 		createParallelTask("Perform Code Review with Tech Lead")
// 	);
// 	sActualDevTasks.branch(
// 		createParallelTask("Perform Actual UI-API integration")
// 	);
// 	sActualDevTasks.branch(createParallelTask("Merge Branch After review"));
// 	sActualDevTasks.branch(
// 		createParallelTask(
// 			"Link API source Code in GitHub and Netlify site in Use Cases Matrix"
// 		)
// 	);

// 	const sActualDevComplete = createCompleteStageTask("Actual Dev-complete");

// 	const sCICDTEST = createProcessTask("CI/CD/TEST");

// 	const sCICDTESTTasks = new sfn.Parallel(stack, "CI/CD/TEST-tasks", {
// 		resultPath: "$.array",
// 	});

// 	sCICDTESTTasks.branch(
// 		createParallelTask(
// 			"Create CI/CD pipeline with common builders/deployers/testers using custom Tekton"
// 		)
// 	);
// 	sCICDTESTTasks.branch(
// 		createParallelTask("Create Kubernetes Operator for the service")
// 	);
// 	sCICDTESTTasks.branch(
// 		createParallelTask("Deploy in Test ENV via CI/CD pipeline")
// 	);
// 	sCICDTESTTasks.branch(
// 		createParallelTask("Perform acceptance tests in Test ENV")
// 	);
// 	sCICDTESTTasks.branch(
// 		createParallelTask(
// 			"Upload Test results to S3 website and link with Netlify website"
// 		)
// 	);
// 	sCICDTESTTasks.branch(
// 		createParallelTask("Upload Test ENV URL to Netlify site")
// 	);
// 	sCICDTESTTasks.branch(createParallelTask("Stage after review by lead"));

// 	const sCICDTESTComplete = createCompleteStageTask("CI/CD/TEST-complete");

// 	const sStageRelease = createProcessTask("Stage/Release");

// 	const sStageReleaseTasks = new sfn.Parallel(stack, "Stage/Release-tasks", {
// 		resultPath: "$.array",
// 	});

// 	sStageReleaseTasks.branch(
// 		createParallelTask("Perform stage tests and review by PM")
// 	);
// 	sStageReleaseTasks.branch(createParallelTask("PM promotes to production"));
// 	sStageReleaseTasks.branch(
// 		createParallelTask("PM performs API security tests in production")
// 	);
// 	sStageReleaseTasks.branch(
// 		createParallelTask("PM creates/updates release notes")
// 	);

// 	const sStageReleaseComplete = createCompleteStageTask(
// 		"Stage/Release-complete"
// 	);

// 	const sPublishOperate = createProcessTask("Publish/Operate");

// 	const sPublishOperateTasks = new sfn.Parallel(
// 		stack,
// 		"Publish/Operate-tasks",
// 		{
// 			resultPath: "$.array",
// 		}
// 	);

// 	sPublishOperateTasks.branch(
// 		createParallelTask(
// 			"DevOps team reviews Prod ENV from security & operation readiness perspective"
// 		)
// 	);
// 	sPublishOperateTasks.branch(
// 		createParallelTask("PM announces the release note to the world")
// 	);

// 	const sPublishOperateComplete = createCompleteStageTask(
// 		"Publish/Operate-complete"
// 	);

// 	const sEnd = new tasks.LambdaInvoke(stack, "end", {
// 		lambdaFunction: completeUsecaseLambda,
// 	});

// 	// Define state machine
// 	const stateMachine = new sfn.StateMachine(stack, "MyWorkflow", {
// 		definition: sRequirement
// 			.next(sRequirementTasks)
// 			.next(sRequirementComplete)
// 			.next(sMockDev)
// 			.next(sMockDevTasks)
// 			.next(sMockDevComplete)
// 			.next(sActualDev)
// 			.next(sActualDevTasks)
// 			.next(sActualDevComplete)
// 			.next(sCICDTEST)
// 			.next(sCICDTESTTasks)
// 			.next(sCICDTESTComplete)
// 			.next(sStageRelease)
// 			.next(sStageReleaseTasks)
// 			.next(sStageReleaseComplete)
// 			.next(sPublishOperate)
// 			.next(sPublishOperateTasks)
// 			.next(sPublishOperateComplete)
// 			.next(sEnd),
// 	});

// 	// Add any outputs or other resources here

// 	return {
// 		stateMachine,
// 	};
// }
