// GIVEN: the load balancer. Read it; you don't need to write it.
//
// Your Fargate task gets a fresh private IP every time it starts, so it's
// useless as an address to hand clients. The ALB sits in front with a DNS name
// that doesn't change. Three pieces: the load balancer itself, a target group
// (the list of things to forward to, plus the health check deciding which are
// fit to serve), and a listener on port 80 forwarding to it.
//
// The detail worth carrying forward is `targetType: "ip"`. Fargate tasks in
// awsvpc mode get their own network interface, so they register by IP rather
// than as EC2 instances. The default is the other one, and the wrong target
// type is a classic cause of an ECS service that never turns healthy -- with an
// error message pointing nowhere near the problem.

import * as aws from "@pulumi/aws";
import { projectName, containerPort } from "./config";
import { vpc, subnetIds } from "./network";
import { albSecurityGroup } from "./security";

export const alb = new aws.lb.LoadBalancer("this", {
  name: `${projectName}-alb`,
  loadBalancerType: "application",
  internal: false,
  subnets: subnetIds,
  securityGroups: [albSecurityGroup.id],
});

// Note the resource option at the bottom. Pulumi normally creates a replacement
// *before* deleting the old one (the opposite of Terraform's default), and with
// a fixed physical name that's impossible -- AWS rejects the second as a
// duplicate. Changing `containerPort` replaces this target group, so without
// the option that change fails with an error pointing nowhere near the cause.
export const targetGroup = new aws.lb.TargetGroup(
  "this",
  {
    name: `${projectName}-tg`,
    port: containerPort,
    protocol: "HTTP",
    vpcId: vpc.id,

    // See the note above.
    targetType: "ip",

    // /health in part-1/backend/server.mjs. The ALB polls it, and only sends
    // real traffic to tasks that answer 200.
    healthCheck: {
      path: "/health",
      matcher: "200",
      interval: 15,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
    },
  },
  {
    deleteBeforeReplace: true,
  },
);

export const listener = new aws.lb.Listener("http", {
  loadBalancerArn: alb.arn,
  port: 80,
  protocol: "HTTP",
  defaultActions: [
    {
      type: "forward",
      targetGroupArn: targetGroup.arn,
    },
  ],
});
