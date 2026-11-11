// GIVEN: the task execution role. Read it; you don't need to write it.
//
// Before your container starts, the ECS agent has to pull the image out of ECR
// and create a log stream, acting on your behalf -- and it needs permission.
// This role belongs to the platform, not your application. (An app that read
// from S3 would get a *task role*, a separate thing.)
//
// Your account isn't allowed to create IAM roles, so this one was created for
// you ahead of time and is shared by the whole class. All this file does is
// look it up by name. It was made with:
//
//   trust policy (who may assume it):
//     { "Effect": "Allow", "Action": "sts:AssumeRole",
//       "Principal": { "Service": "ecs-tasks.amazonaws.com" } }
//   permissions (what they may then do):
//     arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
//
// Two patterns worth taking away:
//
//   - The trust policy is a different question from the permissions policy.
//     AWS always asks both.
//   - For a well-known job like "pull images and write logs", prefer AWS's own
//     managed policy over hand-rolling permissions.

import * as aws from "@pulumi/aws";

export const taskExecutionRole = aws.iam.getRoleOutput({
  name: "cis1912-hw3-ecs-task-execution",
});
