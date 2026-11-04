# GIVEN: the network. Building a VPC from scratch is a homework of its own, so
# we borrow the default VPC every AWS account ships with.
#
# One consequence: these are *public* subnets with no NAT gateway, which is why
# your ECS task needs a public IP -- it's the only way it can reach ECR to pull
# its own image. Production would use private subnets behind a NAT gateway, at
# about $32/month.

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Two subnets, not all of them. An ALB needs at least two availability zones and
# puts a node with its own public IPv4 address in every zone you enable; AWS
# bills each of those by the hour, so all six zones would cost three times as
# much and buy nothing at this scale.
#
# Use this list for the load balancer *and* the ECS service: a target in a zone
# the ALB isn't enabled in gets no traffic, and fails looking exactly like a
# broken health check.
locals {
  subnet_ids = slice(sort(data.aws_subnets.default.ids), 0, 2)
}
