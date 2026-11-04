// GIVEN: the load balancer. Read it; you don't need to write it.
//
// Your Fargate task gets a fresh private IP every time it starts, which makes it
// useless as something to hand out to clients. The load balancer sits in front
// and provides a DNS name that doesn't change. Three pieces:
//
//   - the load balancer itself, internet-facing, spread across the default subnets
//   - a target group: the list of things to forward to, plus the health check
//     that decides which of them are currently fit to serve
//   - a listener on port 80, forwarding to that target group
//
// The one detail worth carrying forward is `targetType: "ip"`. Fargate tasks in
// awsvpc mode each get their own network interface, so they register with the
// target group by IP address rather than as EC2 instances. The default is the
// other one, and a target group with the wrong target type is a classic cause of
// an ECS service that never turns healthy, with an error message that points
// nowhere near the actual problem.

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
// *before* deleting the old one (the opposite of Terraform's default) and
// with a fixed physical name that's impossible: AWS rejects the second one as a
// duplicate. Changing `containerPort` replaces this target group, so without
// this option that change would fail in a way whose error message points
// nowhere near the cause.
export const targetGroup = new aws.lb.TargetGroup(
  "this",
  {
    name: `${projectName}-tg`,
    port: containerPort,
    protocol: "HTTP",
    vpcId: vpc.id,

    // See the note above.
    targetType: "ip",

    // Note the path: this is the /health endpoint in part-1/backend/server.mjs. The
    // load balancer polls it, and only sends real traffic to tasks that answer
    // 200.
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
