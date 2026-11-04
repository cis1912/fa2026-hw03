# GIVEN: the function's execution role. Read it; you don't need to write it.
#
# Same shape as Part 1's task execution role, with two differences: the
# principal is `lambda.amazonaws.com`, and the managed policy grants CloudWatch
# Logs access. Every Lambda function runs as a role, and at minimum needs to
# write its own logs -- without that, a failing function gives you nothing to
# debug with.

resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
