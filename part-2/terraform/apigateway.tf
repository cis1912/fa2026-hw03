# A Lambda function has no URL, no port, and no network presence. API Gateway is
# the front door: it accepts the HTTP request, invokes your function, and turns
# the return value back into an HTTP response.
#
# Your function doesn't parse HTTP at all -- it reads the request out of the
# event object API Gateway hands it and returns a plain object with a status
# code and a body. Have a look at part-2/backend/index.mjs.
#
# The v2 ("HTTP API") resources are the ones to use here:
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/apigatewayv2_api

resource "aws_apigatewayv2_api" "this" {
  name = var.project_name

  # TODO: say which protocol this API speaks. API Gateway v2 supports more than
  #       one; you want plain HTTP, not the realtime one.
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id = aws_apigatewayv2_api.this.id

  # TODO: an integration that proxies the whole request through to your Lambda
  #       function, invoking it by ARN.
  #
  #       It also takes a payload format version, which decides the shape of the
  #       event object your function receives. index.mjs reads the current
  #       format -- see where it gets the request path from, then check which
  #       version produces that shape:
  #       https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
}

resource "aws_apigatewayv2_route" "proxy" {
  api_id = aws_apigatewayv2_api.this.id

  # TODO: send every method, on every path, to the integration above, so both
  #       /health and / end up at your function. Route keys have their own small
  #       syntax, including a wildcard for "any method" and a greedy path
  #       variable; the routing docs cover both.
}

resource "aws_apigatewayv2_route" "root" {
  api_id = aws_apigatewayv2_api.this.id

  # TODO: the same, for the bare root path. Yes, this needs its own route: the
  #       greedy path variable above does not match the root.
}

resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.this.id

  # TODO: a stage to serve the API from. One special stage name serves it with
  #       no path prefix at all; a stage named "prod" would put every request
  #       under /prod. You want the former.
  #
  #       Also arrange for route changes to go live by themselves, rather than
  #       needing a separate deployment resource every time.
}

resource "aws_lambda_permission" "apigw" {
  # TODO: API Gateway is a separate AWS service, and being *wired* to your
  #       function is not the same as being *allowed* to invoke it. Grant the
  #       invoke action to API Gateway's service principal, and scope the grant
  #       so only this API can call this function (rather than anything at AWS
  #       that happens to ask).
  #
  # Leave this out and everything applies cleanly, and then every single curl
  # returns {"message":"Internal Server Error"} with nothing whatsoever in your
  # function's logs -- because the function was never invoked at all. Remember
  # this symptom; you will see it again in your career.
}
