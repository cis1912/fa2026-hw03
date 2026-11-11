# GIVEN: the function's execution role. Read it; you don't need to write it.
#
# Same shape as Part 1's task execution role, and likewise created for you ahead
# of time and only looked up here. Two differences: the trust policy's principal
# is `lambda.amazonaws.com`, and the attached managed policy is
# arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole, which grants
# CloudWatch Logs access. Every Lambda function runs as a role, and at minimum
# needs to write its own logs -- without that, a failing function gives you
# nothing to debug with.

data "aws_iam_role" "lambda" {
  name = "cis1912-hw3-lambda-execution"
}
