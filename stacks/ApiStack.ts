import { StackContext, Api, Table, Script, Cognito, use } from "sst/constructs";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Function } from "sst/constructs";
import { Bucket } from "sst/constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { AuthStack } from "./AuthStack";
import { UserPool } from "aws-cdk-lib/aws-cognito";

export function API({ stack }: StackContext) {
	const pmsTable = new Table(stack, "pmsTable", {
		fields: {
			pk: "string",
			sk: "string",
			gsi1pk: "string",
			gsi1sk: "string",
			gsi2pk: "string",
			gsi2sk: "string",
			gsi3pk: "string",
			gsi3sk: "string",
		},
		primaryIndex: { partitionKey: "pk", sortKey: "sk" },
		globalIndexes: {
			gsi1: { partitionKey: "gsi1pk", sortKey: "gsi1sk" },
			gsi2: { partitionKey: "gsi2pk", sortKey: "gsi2sk" },
			gsi3: { partitionKey: "gsi3pk", sortKey: "gsi3sk" },
		},
		timeToLiveAttribute: "expiresAt",
	});

	const tables = [pmsTable];

	const pmsBucket = new Bucket(stack, "pmsBucket", {
		cors: [
			{
				allowedOrigins: ["*"],
				allowedHeaders: ["*"],
				allowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
			},
		],
	});

	// Create a policy for GetObject
	const getObjectPolicy = new iam.PolicyStatement({
		actions: ["s3:GetObject"],
		effect: iam.Effect.ALLOW,
		resources: [pmsBucket.bucketArn + "/*"],
		principals: [new iam.AnyPrincipal()],
	});

	// Attach the policy to the bucket
	pmsBucket.cdk.bucket.addToResourcePolicy(getObjectPolicy);

	const processLambda = new Function(stack, "WorkflowProcessLambda", {
		handler:
			"packages/functions/stepFunctionLambda/workflow-process-lambda.handler",
	});

	const parallelTaskLambda = new Function(stack, "ParallelTaskLambda", {
		handler:
			"packages/functions/stepFunctionLambda/workflow-parallel-task-lambda.handler",
		bind: tables,
	});

	const completeStageLambda = new Function(stack, "CompleteStage", {
		handler:
			"packages/functions/stepFunctionLambda/workflow-complete-stage.handler",
		bind: tables,
	});

	const completeUsecaseLambda = new Function(stack, "CompleteUsecase", {
		handler:
			"packages/functions/stepFunctionLambda/workflow-complete-usecase.handler",
		bind: tables,
	});

	// Helper function to create a parallel task
	const createParallelTask = (id: string) => {
		return new tasks.LambdaInvoke(stack, id, {
			lambdaFunction: parallelTaskLambda,
			integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
			payload: sfn.TaskInput.fromObject({
				executionArn: sfn.JsonPath.stringAt("$$.Execution.Id"),
				token: sfn.JsonPath.taskToken,
				taskName: sfn.JsonPath.stringAt("$$.State.Name"),
				payload: sfn.JsonPath.entirePayload,
			}),
		});
	};

	// Helper function to create a process task
	const createProcessTask = (id: string) => {
		return new tasks.LambdaInvoke(stack, id, {
			lambdaFunction: processLambda,
			resultPath: "$",
			payloadResponseOnly: true,
			retryOnServiceExceptions: true,
			payload: sfn.TaskInput.fromObject({
				// Include the entire input payload
				payload: sfn.JsonPath.entirePayload,
				// Inject the state name
				stateName: sfn.JsonPath.stringAt("$$.State.Name"),
			}),
		});
	};

	// Helper function to create a complete stage task
	const createCompleteStageTask = (id: string) => {
		return new tasks.LambdaInvoke(stack, id, {
			lambdaFunction: completeStageLambda,
			payloadResponseOnly: true,

			resultPath: "$",
		});
	};

	// Define states
	const sRequirement = createProcessTask("Requirement");

	const sRequirementTasks = new sfn.Parallel(stack, "Requirement-tasks", {
		resultPath: "$.array",
	});

	sRequirementTasks.branch(createParallelTask("Create Use Case Document"));
	sRequirementTasks.branch(createParallelTask("Create Screen Designs"));
	sRequirementTasks.branch(
		createParallelTask(
			"Perform functional design review with the tech team"
		)
	);

	const sRequirementComplete = createCompleteStageTask(
		"Requirement-complete"
	);

	const sMockDev = createProcessTask("Mock Dev");

	const sMockDevTasks = new sfn.Parallel(stack, "Mock Dev-tasks", {
		resultPath: "$.array",
	});

	sMockDevTasks.branch(createParallelTask("Create OpenAPI Specification"));
	sMockDevTasks.branch(
		createParallelTask("Create Postman Tests for OpenAPI specification")
	);
	sMockDevTasks.branch(
		createParallelTask("Create UI screens working with Mock API")
	);
	sMockDevTasks.branch(createParallelTask("Create Test Plans"));

	const sMockDevComplete = createCompleteStageTask("Mock Dev-complete");

	const sActualDev = createProcessTask("Actual Dev");

	const sActualDevTasks = new sfn.Parallel(stack, "Actual Dev-tasks", {
		resultPath: "$.array",
	});

	sActualDevTasks.branch(
		createParallelTask(
			"Create Data Design Page in GitHub as MD file and link it in Netlify site"
		)
	);
	sActualDevTasks.branch(
		createParallelTask(
			"Create API source Code in GitHub and link it in Netlify site"
		)
	);
	sActualDevTasks.branch(
		createParallelTask("Populate Test data or sample data file in GitHub")
	);
	sActualDevTasks.branch(createParallelTask("Create Junit5 Tests in GitHub"));
	sActualDevTasks.branch(
		createParallelTask("Create Cucumber BDD tests in GitHub")
	);
	sActualDevTasks.branch(
		createParallelTask("Create Gatling Performance/Load Tests in GitHub")
	);
	sActualDevTasks.branch(
		createParallelTask("Perform Code Review with Tech Lead")
	);
	sActualDevTasks.branch(
		createParallelTask("Perform Actual UI-API integration")
	);
	sActualDevTasks.branch(createParallelTask("Merge Branch After review"));
	sActualDevTasks.branch(
		createParallelTask(
			"Link API source Code in GitHub and Netlify site in Use Cases Matrix"
		)
	);

	const sActualDevComplete = createCompleteStageTask("Actual Dev-complete");

	const sCICDTEST = createProcessTask("CI CD TEST");

	const sCICDTESTTasks = new sfn.Parallel(stack, "CI CD TEST tasks", {
		resultPath: "$.array",
	});

	sCICDTESTTasks.branch(
		createParallelTask(
			"Build, deploy, and test CI CD pipeline using custom Tekton"
		)
	);
	sCICDTESTTasks.branch(
		createParallelTask("Create Kubernetes Operator for the service")
	);
	sCICDTESTTasks.branch(
		createParallelTask("Deploy in Test ENV via CI CD pipeline")
	);
	sCICDTESTTasks.branch(
		createParallelTask("Perform acceptance tests in Test ENV")
	);
	sCICDTESTTasks.branch(
		createParallelTask(
			"Upload Test results to S3 website and link with Netlify website"
		)
	);
	sCICDTESTTasks.branch(
		createParallelTask("Upload Test ENV URL to Netlify site")
	);
	sCICDTESTTasks.branch(createParallelTask("Stage after review by lead"));

	const sCICDTESTComplete = createCompleteStageTask("CI CD TEST complete");

	const sStageRelease = createProcessTask("Stage Release");

	const sStageReleaseTasks = new sfn.Parallel(stack, "Stage Release tasks", {
		resultPath: "$.array",
	});

	sStageReleaseTasks.branch(
		createParallelTask("Perform stage tests and review by PM")
	);
	sStageReleaseTasks.branch(createParallelTask("PM promotes to production"));
	sStageReleaseTasks.branch(
		createParallelTask("PM performs API security tests in production")
	);
	sStageReleaseTasks.branch(
		createParallelTask("PM creates/updates release notes")
	);

	const sStageReleaseComplete = createCompleteStageTask(
		"Stage Release-complete"
	);

	const sPublishOperate = createProcessTask("Publish Operate");

	const sPublishOperateTasks = new sfn.Parallel(
		stack,
		"Publish Operate tasks",
		{
			resultPath: "$.array",
		}
	);

	sPublishOperateTasks.branch(
		createParallelTask(
			"DevOps team reviews Prod ENV from security & operation readiness perspective"
		)
	);
	sPublishOperateTasks.branch(
		createParallelTask("PM announces the release note to the world")
	);

	const sPublishOperateComplete = createCompleteStageTask(
		"Publish Operate-complete"
	);

	const sEnd = new tasks.LambdaInvoke(stack, "end", {
		lambdaFunction: completeUsecaseLambda,
	});

	// Define state machine
	const stateMachine = new StateMachine(
		stack,
		"SoftwareDevelopmentWorkflow",
		{
			definition: sRequirement
				.next(sRequirementTasks)
				.next(sRequirementComplete)
				.next(sMockDev)
				.next(sMockDevTasks)
				.next(sMockDevComplete)
				.next(sActualDev)
				.next(sActualDevTasks)
				.next(sActualDevComplete)
				.next(sCICDTEST)
				.next(sCICDTESTTasks)
				.next(sCICDTESTComplete)
				.next(sStageRelease)
				.next(sStageReleaseTasks)
				.next(sStageReleaseComplete)
				.next(sPublishOperate)
				.next(sPublishOperateTasks)
				.next(sPublishOperateComplete)
				.next(sEnd),
		}
	);

	const cognito = use(AuthStack);

	const api = new Api(stack, "api", {
		authorizers: {
			UserPoolAuthorizer: {
				type: "user_pool",
				userPool: {
					id: cognito.userPoolId,
					clientIds: [cognito.userPoolClientId],
				},
			},
		},
		defaults: {
			function: {
				bind: tables,
			},
			authorizer: "UserPoolAuthorizer",
		},
		routes: {
			"POST /auth": {
				authorizer: "none",
				function: {
					handler: "packages/functions/api/auth/auth.signIn",
					environment: {
						COGNITO_CLIENT: cognito.userPoolClientId,
					},
				},
			},
			"POST /project": "packages/functions/api/project/project.post",
			"GET /project/{id}/team":
				"packages/functions/api/project/project.getProjectTeam",
			"GET /project/{id}":
				"packages/functions/api/project/project.getProjectById",
			"GET /project/{id}/workflow":
				"packages/functions/api/project/project.getProjectWorkflows",
			"GET /project":
				"packages/functions/api/project/project.getAllProjects",
			"PUT /team/{id}":
				"packages/functions/api/project/project.updateProjectTeam",
			"GET /workflow/{id}":
				"packages/functions/api/workflow/workflow.getWorkflowById",
			"POST /workflow": {
				function: {
					handler:
						"packages/functions/api/workflow/template.addTemplate",
					permissions: ["states:DescribeStateMachine"],
				},
			},
			"GET /template": {
				function: {
					handler: "packages/functions/api/workflow/template.getAll",
				},
			},
			"DELETE /template/{id}":
				"packages/functions/api/workflow/template.delTemplate",

			"POST /usecase": {
				function: {
					handler:
						"packages/functions/api/usecase/usecase.addNewUsecase",
					permissions: [
						"states:StartExecution",
						"states:DescribeStateMachine",
					],
				},
			},
			"GET /usecase/{id}":
				"packages/functions/api/usecase/usecase.getUsecaseById",
			"GET /usecase/{id}/task":
				"packages/functions/api/task/task.getTasks",
			"PUT /task/{id}/complete": {
				function: {
					handler: "packages/functions/api/task/task.completeTask",
					permissions: ["states:SendTaskSuccess"],
				},
			},
			// "GET /user": "packages/functions/api/user/getAlluser.handler",
			"GET /user": "packages/functions/api/user/user.getAll",
			"PUT /user/{id}": "packages/functions/api/user/user.update",
			// "DELETE /user/{id}": "packages/functions/api/user/user.handler",
			"POST /user": {
				authorizer: "none",
				function: {
					handler: "packages/functions/api/user/user.post",
					environment: {
						COGNITO_CLIENT: cognito.userPoolClientId,
					},
				},
			},
			"GET /uploadUrl": {
				function: {
					handler:
						"packages/functions/api/media/getPreSignedS3url.handler",
					bind: [pmsBucket],
				},
			},
		},
	});

	new Script(stack, "SeedScript", {
		defaults: {
			function: {
				bind: [pmsTable],
				environment: {
					TABLE_NAME: pmsTable.tableName,
					STEP_FUNCTIONS: JSON.stringify([
						{
							name: stateMachine.stateMachineName,
							arn: stateMachine.stateMachineArn,
						},
					]),
				},
			},
		},
		onCreate: "stacks/seed.seed",
		onUpdate: "stacks/seed.seed",
	});

	stack.addOutputs({
		LambdaApiEndpoint: api.url,
		SFNStack: stateMachine.stateMachineArn,
	});

	return {
		pmsTable,
		stateMachine,
		api,
	};
}
