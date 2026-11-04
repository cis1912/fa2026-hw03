# The image this part deploys.
#
# Terraform is doing the `docker build` and `docker push` for you -- that's what
# the docker provider in versions.tf is for. You just have to tell it where to
# push to.

resource "aws_ecr_repository" "backend" {
  # TODO: a repository to hold this project's image.
  #
  # Two settings beyond the name matter here:
  #
  #   - `terraform destroy` has to be able to delete a repository that still
  #     contains images. Without that, destroy fails partway through and you
  #     get to clean up by hand. Find the argument that allows it.
  #
  #   - Every build here pushes the *same* tag (var.image_tag, "v1"), so the
  #     repository must allow an existing tag to be overwritten -- mutable
  #     tags. Immutable tags are the better default in production, but they
  #     only work when every build gets its own tag (a commit SHA, say);
  #     combined with a fixed tag, the second push simply fails.
  #
  # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecr_repository
}

resource "docker_image" "backend" {
  # TODO: the image's full name, including the tag to push it under. Build it
  #       from the repository above rather than hardcoding your account ID.
  #       (`terraform validate` will name the missing argument for you.)

  # GIVEN: what to build, and how. The backend source sits next to this directory,
  # in part-1/backend.
  build {
    context    = abspath("${path.module}/../backend")
    dockerfile = "Dockerfile"

    # Pinned so everyone ends up with the same artifact whether their laptop is
    # Apple Silicon or Intel.
    platform = "linux/amd64"
  }

  # GIVEN: rebuild whenever anything under backend/ changes. Without this, the
  # image's only tracked input is its name, which never changes -- so Terraform
  # would never notice edited source at all.
  triggers = {
    source_hash = sha1(join("", [
      for f in fileset("${path.module}/../backend", "**") :
      filesha1("${path.module}/../backend/${f}")
    ]))
  }
}

# GIVEN: pushes the built image up to ECR.
#
# The triggers block is load-bearing, for the same reason as the one above. This
# resource's only tracked input is the image *name*, and that stays "...:v1" on
# every single build. Rebuilding the image would therefore produce no diff here:
# nothing would be pushed, sha256_digest would keep its old value, and your task
# definition would go on pointing at the previous image while you wondered why
# `apply` reported no changes. Tying a trigger to the built image's ID is how the
# provider intends you to force a re-push.
resource "docker_registry_image" "backend" {
  name          = docker_image.backend.name
  keep_remotely = true

  triggers = {
    image_id = docker_image.backend.image_id
  }
}
