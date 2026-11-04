# GIVEN: the knobs for this deployment. Note how much shorter this is than Part
# 1's -- no container port, no image tag, no replica count. There's no container
# and no server, so there's nothing to say about either.

variable "aws_region" {
  description = "Region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name prefix for every resource this configuration creates."
  type        = string

  # Deliberately different from Part 1, so the two parts keep separate state and
  # can be deployed at the same time.
  default = "cis1912-hw3-part2"
}

variable "lambda_runtime" {
  description = "Managed Lambda runtime to run the function on."
  type        = string

  # Runtimes get deprecated on a published schedule, so this is a value you'd
  # genuinely have to bump every year or two in a real project:
  # https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
  #
  # Note that you can't just name any runtime AWS currently supports: the AWS
  # provider version pinned in versions.tf validates this string against a list
  # baked into that release, so adopting a brand-new runtime also means
  # upgrading the provider. Your dependencies constrain your infrastructure.
  default = "nodejs22.x"
}

variable "lambda_memory" {
  description = "Memory (MiB) for the function. CPU is allocated proportionally."
  type        = number
  default     = 128
}

variable "lambda_timeout" {
  description = "Max seconds per invocation. API Gateway caps this at 30."
  type        = number
  default     = 10
}
