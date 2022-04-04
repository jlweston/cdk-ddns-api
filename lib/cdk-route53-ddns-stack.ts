import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  IdentitySource,
  LambdaIntegration,
  RequestAuthorizer,
  RestApi,
  TokenAuthorizer,
} from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";

type Props = StackProps & {
  env: {
    DDNS_USERNAME: string;
    DDNS_PASSWORD: string;
  };
};

export class CdkRoute53DdnsStack extends Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    // Create our lambda functions

    const authLambda = new NodejsFunction(this, "DDNSAuthLambda", {
      entry: "./lib/lambda/ddns-auth.ts",
      runtime: Runtime.NODEJS_14_X,
      environment: {
        DDNS_USERNAME: props.env.DDNS_USERNAME,
        DDNS_PASSWORD: props.env.DDNS_PASSWORD,
      },
    });

    const ddnsLambda = new NodejsFunction(this, "DDNSLambda", {
      entry: "./lib/lambda/ddns.ts",
      awsSdkConnectionReuse: true,
      runtime: Runtime.NODEJS_14_X,
    });

    // Grant the permissions required to interact with Route 53

    const route53ChangeResourceRecordSetsPolicy = new PolicyStatement({
      actions: ["route53:ChangeResourceRecordSets"],
      resources: ["*"],
    });

    const route53ListHostedZonesPolicy = new PolicyStatement({
      actions: ["route53:ListHostedZonesByName", "route53:ListHostedZones"],
      resources: ["*"],
    });

    ddnsLambda.role?.attachInlinePolicy(
      new Policy(this, "DDNSLambdaPolicy", {
        statements: [
          route53ChangeResourceRecordSetsPolicy,
          route53ListHostedZonesPolicy,
        ],
      })
    );

    // Set up our API

    const apiGateway = new RestApi(this, "DDNSApiGateway", {
      restApiName: "DDNS",
      description: "DDNS API Gateway",
    });

    apiGateway.root
      .addResource("update")
      .addMethod("POST", new LambdaIntegration(ddnsLambda), {
        authorizer: new RequestAuthorizer(this, "DDNSTokenAuthorizer", {
          handler: authLambda,
          identitySources: [IdentitySource.header("Authorization")],
        }),
      });
  }
}
