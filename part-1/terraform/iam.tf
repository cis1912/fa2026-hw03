# GIVEN: the task execution role. Read it; you don't need to write it.
#
# Before your container starts, the ECS agent has to pull the image out of ECR
# and create a log stream, acting on your behalf -- and it needs permission.
# This role belongs to the platform, not your application. (An app that read
# from S3 would get a *task role*, a separate thing.)
#
# Two patterns worth taking away:
#
#   - The trust policy ("who may assume this role") is a different question
#     from the permissions policy ("what may they then do"). AWS asks both.
#   - For a well-known job like "pull images and write logs", prefer AWS's own
#     managed policy over hand-rolling permissions.

resource "aws_iam_role" "task_execution" {
  name = "${var.project_name}-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
