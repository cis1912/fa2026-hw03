# GIVEN: provider setup. Nothing to change here.
#
# Note what's missing compared to Part 1: there's no docker provider and no ECR
# authentication, because this part never builds an image. Your code ships as a
# zip file that AWS runs on a runtime it supplies.
#
# The archive provider is what builds that zip, during plan/apply, from the
# source in part-2/backend.

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project = var.project_name
      Course  = "CIS1912"
    }
  }
}
