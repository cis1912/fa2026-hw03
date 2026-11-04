# GIVEN: the network. Building a VPC from scratch (subnets, route tables, NAT
# gateways) is a homework of its own, so we borrow the default VPC that every
# AWS account ships with.
#
# One consequence worth understanding: these are *public* subnets, and there's
# no NAT gateway here. That's why your ECS task will need a public IP -- it's
# the only way it can reach ECR to pull its own image. A production setup would
# put tasks in private subnets behind a NAT gateway instead, at about $32/month
# for the privilege.

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
