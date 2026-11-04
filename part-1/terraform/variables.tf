# GIVEN: the knobs for this deployment. Override them in a terraform.tfvars if
# you like; the defaults all work as-is.

variable "aws_region" {
  description = "Region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name prefix for every resource this configuration creates."
  type        = string
  default     = "cis1912-hw3-part1"
}

variable "container_port" {
  description = "Port the backend listens on inside the container."
  type        = number
  default     = 8000
}

variable "image_tag" {
  description = "Tag to push the backend image under."
  type        = string
  default     = "v1"
}

variable "desired_count" {
  description = "How many copies of the task the ECS service should run."
  type        = number
  default     = 1
}
