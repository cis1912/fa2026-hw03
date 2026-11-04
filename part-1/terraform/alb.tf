# GIVEN: the load balancer. Read it; you don't need to write it.
#
# Your Fargate task gets a fresh private IP every time it starts, which makes it
# useless as something to hand out to clients. The load balancer sits in front
# and provides a DNS name that doesn't change. Three pieces:
#
#   - the load balancer itself, internet-facing, spread across the default subnets
#   - a target group: the list of things to forward to, plus the health check
#     that decides which of them are currently fit to serve
#   - a listener on port 80, forwarding to that target group
#
# The one detail worth carrying forward is `target_type = "ip"`. Fargate tasks in
# awsvpc mode each get their own network interface, so they register with the
# target group by IP address rather than as EC2 instances. The default is the
# other one, and a target group with the wrong target type is a classic cause of
# an ECS service that never turns healthy -- with an error message that points
# nowhere near the actual problem.

resource "aws_lb" "this" {
  name               = "${var.project_name}-alb"
  load_balancer_type = "application"
  internal           = false
  subnets            = data.aws_subnets.default.ids
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "this" {
  name     = "${var.project_name}-tg"
  port     = var.container_port
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  # See the note above.
  target_type = "ip"

  # Note the path: this is the /health endpoint in part-1/backend/server.mjs. The load
  # balancer polls it, and only sends real traffic to tasks that answer 200.
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
