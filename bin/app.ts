/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as cdk from 'aws-cdk-lib';
import { CfnOutput, SecretValue, Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { BuildEnvironmentVariableType, BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import dotenv from 'dotenv';

import { STAGE } from '../lib/util/stage';
import { SERVICE_NAME } from './constants';
import { APIStack } from './stacks/api-stack';

dotenv.config();

export class APIStage extends Stage {
  public readonly url: CfnOutput;

  constructor(
    scope: Construct,
    id: string,
    props: StageProps & {
      provisionedConcurrency: number;
      chatbotSNSArn?: string;
      stage: string;
      envVars: Record<string, string>;
    }
  ) {
    super(scope, id, props);
    const { provisionedConcurrency, chatbotSNSArn, stage, env, envVars } = props;

    const { url } = new APIStack(this, `${SERVICE_NAME}API`, {
      env,
      provisionedConcurrency,
      chatbotSNSArn,
      stage,
      envVars,
    });
    this.url = url;
  }
}

export class APIPipeline extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const code = CodePipelineSource.gitHub('Uniswap/gouda-parameterization-api', 'main', {
      authentication: SecretValue.secretsManager('github-token-2'),
    });

    const synthStep = new CodeBuildStep('Synth', {
      input: code,
      buildEnvironment: {
        buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_6_0,
        environmentVariables: {
          NPM_TOKEN: {
            value: 'npm-private-repo-access-token',
            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
          },
          GH_TOKEN: {
            value: 'github-token-2',
            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
          },
        },
      },
      commands: [
        'git config --global url."https://${GH_TOKEN}@github.com/".insteadOf ssh://git@github.com/',
        'echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && yarn install --frozen-lockfile --network-concurrency 1',
        'yarn build',
        'npx cdk synth --verbose',
      ],
      partialBuildSpec: BuildSpec.fromObject({
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
          },
        },
      }),
    });

    const pipeline = new CodePipeline(this, `${SERVICE_NAME}Pipeline`, {
      // The pipeline name
      pipelineName: `${SERVICE_NAME}`,
      crossAccountKeys: true,
      synth: synthStep,
    });

    // Beta us-east-2

    const betaUsEast2Stage = new APIStage(this, 'beta-us-east-2', {
      env: { account: '801328487475', region: 'us-east-2' },
      provisionedConcurrency: 2,
      stage: STAGE.BETA,
      envVars: envVars,
    });

    const betaUsEast2AppStage = pipeline.addStage(betaUsEast2Stage);

    this.addIntegTests(code, betaUsEast2Stage, betaUsEast2AppStage);

    // Prod us-east-2
    const prodUsEast2Stage = new APIStage(this, 'prod-us-east-2', {
      env: { account: '830217277613', region: 'us-east-2' },
      provisionedConcurrency: 5,
      chatbotSNSArn: 'arn:aws:sns:us-east-2:644039819003:SlackChatbotTopic',
      stage: STAGE.PROD,
      envVars: envVars,
    });

    const prodUsEast2AppStage = pipeline.addStage(prodUsEast2Stage);

    this.addIntegTests(code, prodUsEast2Stage, prodUsEast2AppStage);

    pipeline.buildPipeline();
  }

  private addIntegTests(
    sourceArtifact: cdk.pipelines.CodePipelineSource,
    apiStage: APIStage,
    applicationStage: cdk.pipelines.StageDeployment
  ) {
    const testAction = new CodeBuildStep(`${SERVICE_NAME}-IntegTests-${apiStage.stageName}`, {
      projectName: `${SERVICE_NAME}-IntegTests-${apiStage.stageName}`,
      input: sourceArtifact,
      envFromCfnOutputs: {
        UNISWAP_API: apiStage.url,
      },
      buildEnvironment: {
        buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_6_0,
        environmentVariables: {
          NPM_TOKEN: {
            value: 'npm-private-repo-access-token',
            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
          },
          GH_TOKEN: {
            value: 'github-token-2',
            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
          },
        },
      },
      commands: [
        'git config --global url."https://${GH_TOKEN}@github.com/".insteadOf ssh://git@github.com/',
        'echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc',
        'echo "UNISWAP_API=${UNISWAP_API}" > .env',
        'yarn install --frozen-lockfile --network-concurrency 1',
        'yarn build',
        'yarn test:integ',
      ],
      partialBuildSpec: BuildSpec.fromObject({
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
          },
        },
      }),
    });

    applicationStage.addPost(testAction);
  }
}

// Local Dev Stack
const app = new cdk.App();

const envVars: { [key: string]: string } = {};
envVars['PARAMETERIZATION_API_URL'] = process.env['PARAMETERIZATION_API_URL'] || '';
envVars['ROUTING_API_URL'] = process.env['ROUTING_API_URL'] || '';
envVars['SERVICE_URL'] = process.env['SERVICE_URL'] || '';

new APIStack(app, `${SERVICE_NAME}Stack`, {
  provisionedConcurrency: process.env.PROVISION_CONCURRENCY ? parseInt(process.env.PROVISION_CONCURRENCY) : 0,
  throttlingOverride: process.env.THROTTLE_PER_FIVE_MINS,
  chatbotSNSArn: process.env.CHATBOT_SNS_ARN,
  stage: STAGE.LOCAL,
  envVars: envVars,
});

new APIPipeline(app, `${SERVICE_NAME}PipelineStack`, {
  env: { account: '644039819003', region: 'us-east-2' },
});
