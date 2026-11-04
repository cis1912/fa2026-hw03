# GIVEN: provider setup. You don't need to change anything in this file, but do
# read it. It explains where your image comes from.
#
# Two providers are in play:
#   - aws    -- everything in your account (ECR, ECS, the ALB, IAM, logs)
#   - docker -- builds the image in ../../backend and pushes it to ECR, so you
#               never run `docker build` or `docker push` by hand
#
# The docker provider needs credentials for your ECR registry. The
# aws_ecr_authorization_token data source mints a short-lived username and
# password for exactly that, and we hand it straight to the provider below.

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
