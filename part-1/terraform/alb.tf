# GIVEN: the load balancer. Read it; you don't need to write it.
#
# Your Fargate task gets a fresh private IP every time it starts, so it's
# useless as an address to hand clients. The ALB sits in front with a DNS name
# that doesn't change. Three pieces: the load balancer itself, a target group
# (the list of things to forward to, plus the health check deciding which are
# fit to serve), and a listener on port 80 forwarding to it.
#
# The detail worth carrying forward is `target_type = "ip"`. Fargate tasks in
# awsvpc mode get their own network interface, so they register by IP rather
# than as EC2 instances. The default is the other one, and the wrong target type
# is a classic cause of an ECS service that never turns healthy -- with an error
# message pointing nowhere near the problem.

resource "aws_lb" "this" {
  name               = "${var.project_name}-alb"
  load_balancer_type = "application"
  internal           = false
  subnets            = local.subnet_ids
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "this" {
  name     = "${var.project_name}-tg"
  port     = var.container_port
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  # See the note above.
  target_type = "ip"

  # /health in part-1/backend/server.mjs. The ALB polls it, and only sends real
  # traffic to tasks that answer 200.
  health_check {
    path                = "/health"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }
}
