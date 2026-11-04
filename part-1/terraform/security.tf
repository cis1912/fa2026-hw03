# Two security groups, because "the internet can reach the load balancer" and
# "the load balancer can reach the tasks" are two different permissions.
#
# A security group is a stateful firewall attached to a network interface.
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb"
  description = "Public HTTP access to the load balancer"
  vpc_id      = data.aws_vpc.default.id

  # TODO: let the public reach this load balancer over HTTP, and let the load
  #       balancer open outbound connections to your tasks.
}

resource "aws_security_group" "service" {
  name        = "${var.project_name}-service"
  description = "Only the load balancer may reach the tasks"
  vpc_id      = data.aws_vpc.default.id

  # TODO: let the tasks accept traffic on the port the app listens on -- but
  #       only from the load balancer, not from the internet at large. Your task
  #       will have a public IP (see network.tf), so "only from the load
  #       balancer" is a claim you have to actually make, not something you get
  #       for free.
  #
  #       A rule's source doesn't have to be an address range; it can name
  #       another security group. That distinction is the whole exercise here.
  #
  # TODO: the tasks also need outbound access, to pull their image and ship logs.
}
