output "base_url" {
  description = "Where your backend is reachable. Feed this to curl."

  # GIVEN: api_endpoint already points at the $default stage, so there's no
  # path prefix to tack on -- unlike a named stage, which you'd have to append.
  value = aws_apigatewayv2_api.this.api_endpoint
}

output "function_name" {
  description = "Handy for `aws logs tail /aws/lambda/<name> --follow`."
  value       = aws_lambda_function.backend.function_name
}
