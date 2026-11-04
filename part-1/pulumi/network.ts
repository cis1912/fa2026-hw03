// GIVEN: the network. Building a VPC from scratch (subnets, route tables, NAT
// gateways) is a homework of its own, so we borrow the default VPC that every
// AWS account ships with.
//
// One consequence worth understanding: these are *public* subnets, and there's
// no NAT gateway here. That's why your ECS task will need a public IP. It's
// the only way it can reach ECR to pull its own image. A production setup would
// put tasks in private subnets behind a NAT gateway instead, at about $32/month
// for the privilege.

import * as aws from "@pulumi/aws";

export const vpc = aws.ec2.getVpcOutput({ default: true });

const allSubnetIds = aws.ec2.getSubnetsOutput({
  filters: [{ name: "vpc-id", values: [vpc.id] }],
}).ids;

// Two of those subnets, not all of them.
//
// A load balancer needs at least two availability zones, and it puts a node
// (each with its own public IPv4 address) in every zone you enable. AWS bills
// every public IPv4 address by the hour, so handing it all six zones this
// account happens to have would cost three times as much as two, and buy you
// nothing at this scale.
//
// This same list is used for the load balancer *and* for the ECS service,
// because the two have to agree: a target registered in a zone the load
// balancer isn't enabled in receives no traffic at all, and it fails in a way
// that looks exactly like a broken health check.
export const subnetIds = allSubnetIds.apply((ids) =>
  [...ids].sort().slice(0, 2),
);
