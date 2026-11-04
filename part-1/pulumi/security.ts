// Two security groups, because "the internet can reach the load balancer" and
// "the load balancer can reach the tasks" are two different permissions.
//
// A security group is a stateful firewall attached to a network interface.
// https://www.pulumi.com/registry/packages/aws/api-docs/ec2/securitygroup/

import * as aws from "@pulumi/aws";
import { projectName, containerPort } from "./config";
import { vpc } from "./network";

export const albSecurityGroup = new aws.ec2.SecurityGroup("alb", {
  name: `${projectName}-alb`,
  description: "Public HTTP access to the load balancer",
  vpcId: vpc.id,

  // TODO: let the public reach this load balancer over HTTP, and let the load
  //       balancer open outbound connections to your tasks.
});

export const serviceSecurityGroup = new aws.ec2.SecurityGroup("service", {
  name: `${projectName}-service`,
  description: "Only the load balancer may reach the tasks",
  vpcId: vpc.id,

  // TODO: let the tasks accept traffic on the port the app listens on, but
  //       only from the load balancer, not from the internet at large. Your
  //       task will have a public IP (see network.ts), so "only from the load
  //       balancer" is a claim you have to actually make, not something you
  //       get for free.
  //
  //       A rule's source doesn't have to be an address range; it can name
  //       another security group. That distinction is the whole exercise.
  //
  // TODO: the tasks also need outbound access, to pull their image and ship
  //       logs. This is not redundant: AWS gives a brand-new security group an
  //       allow-all egress rule, but managing the group as code *removes* it.
  //       Leave egress out and you get a group that permits nothing outbound:
  //       a task that can't fetch its own image, and a load balancer with
  //       no healthy targets and no obvious explanation.
});
