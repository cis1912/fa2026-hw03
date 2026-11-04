# GIVEN: provider setup. Nothing to change, but read it -- it explains where
# your image comes from.
#
#   - aws    -- everything in your account (ECR, ECS, the ALB, IAM, logs)
#   - docker -- builds the image in ../backend and pushes it to ECR, so you
#               never run `docker build` or `docker push` by hand
#
# The docker provider needs ECR credentials; aws_ecr_authorization_token mints
# short-lived ones and we hand them straight to it below.

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
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

data "aws_ecr_authorization_token" "this" {}

provider "docker" {
  registry_auth {
    address  = data.aws_ecr_authorization_token.this.proxy_endpoint
    username = data.aws_ecr_authorization_token.this.user_name
    password = data.aws_ecr_authorization_token.this.password
  }
}
