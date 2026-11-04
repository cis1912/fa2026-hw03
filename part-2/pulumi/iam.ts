// GIVEN: the function's execution role. Read it; you don't need to write it.
//
// Same shape as Part 1's task execution role, with two differences: the
// principal is `lambda.amazonaws.com`, and the managed policy is the one
// granting CloudWatch Logs access. Every Lambda function runs as a role, and at
// minimum it needs to write its own logs -- without that, a failing function
// gives you nothing at all to debug with.

import * as aws from "@pulumi/aws";
import { projectName } from "./config";

export const lambdaRole = new aws.iam.Role("lambda", {
    name: `${projectName}-lambda`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: "sts:AssumeRole",
            Principal: { Service: "lambda.amazonaws.com" },
        }],
    }),
});

export const lambdaPolicyAttachment = new aws.iam.RolePolicyAttachment("lambda", {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});
