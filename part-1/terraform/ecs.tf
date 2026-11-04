# GIVEN: somewhere for your container's logs to land. Without this, debugging a
# task that won't start is nearly impossible.
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 7
}

resource "aws_ecs_cluster" "this" {
  # TODO: name the cluster. (With Fargate a "cluster" is just a namespace --
  #       there are no servers to join it. You're naming a grouping.)
}

resource "aws_ecs_task_definition" "backend" {
  family = var.project_name

  # TODO: declare that this task runs on Fargate. That constrains several things
  #       at once: which launch types the task is compatible with, which
  #       networking mode it uses, and the fact that CPU and memory are
  #       requested on the *task* rather than per container (256 CPU units and
  #       512 MiB is plenty). It also needs the execution role from iam.tf.
  #
  # TODO: describe the one container to run, in `container_definitions`. That
  #       argument is a JSON string; jsonencode([{ ... }]) keeps it readable.
  #       The fields need to cover: which image to run, which port the app
  #       listens on, the PLATFORM environment variable the app reports back
  #       (set it so a response identifies this deployment), and where logs go
  #       -- the driver that ships to CloudWatch, pointed at the group above,
  #       in this region.
  #
  #       Keep the container definition reference open; the field names are
  #       AWS's, not Terraform's:
  #       https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_ContainerDefinition.html
  #
  #       Reference the image by *digest*, not by tag -- docker_registry_image
  #       exports the digest of whatever it pushed. A task definition naming
  #       ":v1" doesn't change when you rebuild ":v1": Terraform sees no diff,
  #       writes no new revision, and your new code never ships. The digest
  #       changes whenever the image's contents do, so the dependency is real.
}

resource "aws_ecs_service" "backend" {
  name            = var.project_name
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  # TODO: in awsvpc mode the service has to be told how to place its tasks on
  #       the network: which subnets, which security group, and whether a task
  #       gets a public IP. It needs one here -- network.tf explains why, and
  #       defines the subnet list to use (and why it isn't all of them).
  #
  # TODO: register this service with the target group from alb.tf, so the load
  #       balancer learns where to send traffic. You'll have to name which
  #       container and port it should be delivered to.
  #
  # TODO: two orderings nothing above expresses, both of which Terraform will
  #       otherwise get wrong on a first apply:
  #         - the service can't register targets before the listener exists
  #         - the first task can't pull its image before the execution role's
  #           *policy attachment* lands. Referencing the role in the task
  #           definition creates no dependency on the attachment.
  #       Terraform has a meta-argument for dependencies it can't infer.
}
