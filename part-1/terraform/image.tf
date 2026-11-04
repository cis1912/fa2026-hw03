# The image this part deploys.
#
# Terraform is doing the `docker build` and `docker push` for you -- that's what
# the docker provider in versions.tf is for. You just have to tell it where to
# push to.

resource "aws_ecr_repository" "backend" {
  # TODO: a repository to hold this project's image.
  #
  # Two settings beyond the name are worth looking up. One lets `terraform
  # destroy` remove a repository that still contains images -- without it,
  # destroy fails partway through and you clean up by hand. The other controls
  # whether a later push may overwrite an existing tag.
  #
  # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecr_repository
}

resource "docker_image" "backend" {
  # TODO: the image's full name, including the tag to push it under. Build it
  #       from the repository above rather than hardcoding your account ID.
  name = # TODO

  # GIVEN: what to build, and how. The backend source sits next to this directory,
  # in part-1/backend.
  build {
    context    = abspath("${path.module}/../backend")
    dockerfile = "Dockerfile"

    # Pinned so everyone ends up with the same artifact whether their laptop is
    # Apple Silicon or Intel.
    platform = "linux/amd64"
  }

  # GIVEN: rebuild whenever anything under backend/ changes.
  triggers = {
    source_hash = sha1(join("", [
      for f in fileset("${path.module}/../backend", "**") :
      filesha1("${path.module}/../backend/${f}")
    ]))
  }
}

# GIVEN: pushes the built image up to ECR.
resource "docker_registry_image" "backend" {
  name          = docker_image.backend.name
  keep_remotely = true
}
