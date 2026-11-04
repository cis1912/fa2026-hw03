## Part 1

> Terraform and Pulumi both keep a *state file*. Why is state necessary at all — why can't the tool just inspect your AWS account and diff it against your configuration? What does `terraform plan` / `pulumi preview` give you that clicking through the AWS console doesn't?

## Part 2

> Both parts deploy a backend that does the same trivial thing, but they ship it completely differently: Part 1 built a container image, pushed it to a registry, and kept a server running behind a load balancer; Part 2 zipped up one source file and let AWS supply the runtime, with nothing running at all between requests. Compare the two on cold start, cost when idle versus under sustained load, and how each one scales. Part 2 needed far less infrastructure — what did you give up to get that, and when would you still choose Part 1's shape?
