resource "aws_cloudwatch_log_group" "lambda" {
  # TODO: Lambda writes to a log group whose name follows a fixed convention
  #       based on the function name -- look it up rather than guessing. Declare
  #       it here, with a short retention, so Terraform owns it and `destroy`
  #       cleans it up.
  #
  #       Get the name wrong (or leave this empty) and nothing fails: this
  #       resource has no required arguments, so you'll create an
  #       arbitrarily-named group, Lambda will create the real one itself on
  #       first invocation with retention "never expire", every check in this
  #       homework will still pass, and `destroy` will tidy away the decoy and
  #       leave the real one behind forever. The Cleanup section shows how to
  #       check which one you got.
}

resource "aws_lambda_function" "backend" {
  function_name = var.project_name
  role          = data.aws_iam_role.lambda.arn

  # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function
  #
  # TODO: point the function at the deployment package that package.tf built,
  #       and tell AWS how to run it: which managed runtime (var.lambda_runtime)
  #       and which function inside the package to call per request. That last
  #       one is a string naming both the module and the exported function --
  #       look at part-2/backend/index.mjs, and at how the zip is laid out
  #       (`unzip -l build/function.zip` once you've run a plan).
  #
  # TODO: also give Terraform something derived from the zip's *contents* -- the
  #       archive data source in package.tf exports a hash for exactly this.
  #       The package's path never changes, so with only a path to go on,
  #       editing index.mjs changes nothing Terraform can see: your apply is a
  #       no-op while you wonder why the new code isn't live. This is Part 1's
  #       image-tag-versus-digest trap wearing different clothes.
  #
  # TODO: the memory and time limits, from the variables provided for them.
  #
  # TODO: the PLATFORM environment variable, as you set it in Part 1, so a
  #       response identifies which of your two deployments answered.

  # GIVEN: make sure the log group exists before the function can write to it.
  depends_on = [aws_cloudwatch_log_group.lambda]
}
