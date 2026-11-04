# GIVEN: nothing to fill in here -- but `base_url` is the one you'll use
# constantly, so know it's here:
#
#   curl "$(terraform output -raw base_url)/health"

output "base_url" {
  description = "Where your backend is reachable. Feed this to curl."
  value       = "http://${aws_lb.this.dns_name}"
}

output "ecr_repository_url" {
  description = "The repository Terraform pushed your image to."
  value       = aws_ecr_repository.backend.repository_url
}

output "cluster_name" {
  description = "Handy for `aws ecs describe-services` when something is wrong."
  value       = aws_ecs_cluster.this.name
}
