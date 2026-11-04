# GIVEN: the deployment package. Read it; you don't need to write it.
#
# In Part 1, shipping your code meant building a container image and pushing it
# to a registry. Here it means putting a single .mjs file in a zip -- done
# locally, during plan, with no cloud involved -- and that zip is the entire
# artifact Lambda runs.
#
# `output_base64sha256` is the piece worth noticing. You'll hand it to the
# function in lambda.tf, where it plays exactly the role the image digest played
# in Part 1: it's how Terraform can tell the code inside an otherwise
# identically-named zip has changed.

data "archive_file" "function" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/build/function.zip"
}
