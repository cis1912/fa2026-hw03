// GIVEN: the task execution role. Read it; you don't need to write it.
//
// Before your container starts, the ECS agent has to pull the image out of ECR
// and create a log stream, acting on your behalf -- and it needs permission.
// This role belongs to the platform, not your application. (An app that read
// from S3 would get a *task role*, a separate thing.)
//
// Two patterns worth taking away:
//
//   - The trust policy ("who may assume this role") is a different question
//     from the permissions policy ("what may they then do"). AWS asks both.
//   - For a well-known job like "pull images and write logs", prefer AWS's own
//     managed policy over hand-rolling permissions.

import * as aws from "@pulumi/aws";
import { projectName } from "./config";

export const taskExecutionRole = new aws.iam.Role("taskExecution", {
  name: `${projectName}-task-execution`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: "sts:AssumeRole",
        Principal: { Service: "ecs-tasks.amazonaws.com" },
      },
    ],
  }),
});

export const taskExecutionPolicyAttachment = new aws.iam.RolePolicyAttachment(
  "taskExecution",
  {
    role: taskExecutionRole.name,
    policyArn:
      "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  },
);
