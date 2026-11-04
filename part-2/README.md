# Part 2 (Optional): The Same Job, Without a Server

Stop and notice what Part 1 actually built. There is a container running right now — or there was, until you destroyed it — and it runs whether or not anybody is making requests. At 3am, with zero traffic, you are paying for a load balancer and a task sitting there waiting. That's the right shape for plenty of applications. It is a strange shape for an app whose entire job is to read a clock.

**Serverless** inverts it: you upload your code, and nothing runs until a request arrives. AWS starts a copy, handles the request, keeps the copy warm for a while in case another comes, and eventually throws it away. A thousand simultaneous requests? A thousand copies, without you configuring any scaling. No requests? Nothing running, nothing billed.

So this part deploys a backend that does the same trivial thing — it tells you the time — and almost everything else about how it gets there is different:

|                        | Part 1                                                 | Part 2                                                 |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| The artifact           | a container image you build                            | a zip of one source file                               |
| Where it lives         | a registry (ECR) you provision                         | uploaded straight to Lambda                            |
| The runtime            | yours — you chose the base image, you start the server | AWS's — you pick `nodejs22.x` and hand over a function |
| The language           | Node 22                                                | Node 22 — deliberately the same                        |
| What's running at idle | a container, and a load balancer                       | nothing                                                |
| Your code's shape      | an HTTP server with routes                             | one function, called per request                       |

Note the last two rows together. Both parts are Node 22, both just read a clock — and [`backend/index.mjs`](./backend/index.mjs) still isn't the same file as Part 1's `server.mjs`. Part 1's creates an HTTP server and listens on a port; this one exports a single function and never thinks about HTTP at all. Lambda doesn't want a server; it wants something it can call. The platform shapes the code, which is worth noticing on its own — "just deploy it differently" is rarely _just_.

Holding the language constant is the point, though: everything else you observe between the two parts is attributable to the deployment model, not to a change of stack.

It's also a fraction of the infrastructure. No network, no load balancer, no cluster, no scaling configuration, no registry. Two files carry TODOs. Keep an eye on what that reduction costs you, because Step 0 asks.

## Step 0: Containers or Functions?

> 🤔 This is something we'd like you to think about...(again)

Deploy this part first — you'll want to have actually seen the behaviour before answering. Then, in [RESPONSE.md](../RESPONSE.md):

> Both parts deploy a backend that does the same trivial thing, but they ship it completely differently: Part 1 built a container image, pushed it to a registry, and kept a server running behind a load balancer; Part 2 zipped up one source file and let AWS supply the runtime, with nothing running at all between requests. Compare the two on cold start, cost when idle versus under sustained load, and how each one scales. Part 2 needed far less infrastructure — what did you give up to get that, and when would you still choose Part 1's shape?

The [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-features.html) and [Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) docs are the places to look, and Step 4 will hand you some of the observations. Lambda's [quotas page](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html) is worth a skim for the "what did you give up" half.

## Step 1: Getting Oriented

Use the same tool you used in Part 1 — [`terraform/`](./terraform) or [`pulumi/`](./pulumi).

Already written for you:

| Terraform                     | Pulumi                     |                                                                                                     |
| ----------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| `versions.tf`, `variables.tf` | `Pulumi.yaml`, `config.ts` | Provider and configuration setup. Read what's _missing_ versus Part 1.                              |
| `package.tf`                  | —                          | The deployment package — the zip. On the Pulumi track you build the archive inline, in `lambda.ts`. |
| `iam.tf`                      | `iam.ts`                   | The function's execution role — given, as Part 1's was.                                             |
| `outputs.tf`                  | `index.ts`                 | Your outputs, including `base_url` / `baseUrl`.                                                     |

Yours to write, in this order:

| Terraform       | Pulumi          |                               |
| --------------- | --------------- | ----------------------------- |
| `lambda.tf`     | `lambda.ts`     | The function itself — Step 2. |
| `apigateway.tf` | `apigateway.ts` | The front door — Step 3.      |

## Step 2: The Function

Fill in the TODOs in `lambda.tf` / `lambda.ts`.

The execution role is given, the same way Part 1's was — the identical pattern with `lambda.amazonaws.com` as the principal, plus the managed policy that lets the function write its own logs. Worth a glance, since a function that can't log is a function you cannot debug, but there's nothing new in it.

The function itself is yours, and three of its arguments are the interesting ones:

- **The deployment package.** Terraform's `package.tf` has already zipped `backend/` for you; Pulumi builds the archive inline. Either way, that zip is the whole artifact — there's no image and no registry anywhere in this part.
- **The runtime and the handler.** You're not supplying a server or a start command any more. You name a runtime for AWS to provide, and one exported function inside your package for it to call. Managed runtimes are also deprecated on a published schedule, which makes `nodejs22.x` a value you'd really have to bump every year or two. The pinned AWS provider version also limits which runtime strings you can even name, so that bump can drag a provider upgrade along with it.
- **The source hash** (Terraform only). The package's path never changes, so with only a path to go on, editing `index.mjs` changes nothing Terraform can see — your apply is a no-op while you wonder why your new code isn't live. It's precisely Part 1's image-tag-versus-digest trap in different clothes. Pulumi hashes the archive itself, so its track doesn't need this.

Also set `PLATFORM=lambda` in the environment, as you did in the task definition. That's how `curl` will tell the two deployments apart.

## Step 3: The Front Door

Fill in the TODOs in `apigateway.tf` / `apigateway.ts`.

A Lambda function has no URL, no port, and no network presence. **API Gateway** is what gives it one: it accepts the HTTP request, invokes your function, and turns the return value back into an HTTP response. In Part 1 the load balancer played this role, and the pieces line up more than you'd expect:

| Part 1                                  | Part 2                  |
| --------------------------------------- | ----------------------- |
| Load balancer                           | HTTP API                |
| Listener                                | Route                   |
| Target group                            | Integration             |
| Security group rule allowing the ALB in | `aws_lambda_permission` |

That last row is the one to watch. Wiring API Gateway to your function does not grant it permission to invoke your function — those are two separate statements, and AWS requires both. Omit the permission and everything deploys without complaint, and then every request returns `{"message":"Internal Server Error"}` with **nothing in your function's logs**, because the function genuinely never ran. Learn that symptom now; it's a classic.

You'll also need two routes rather than one. `{proxy+}` is greedy, but it does not match the bare root path.

## Step 4: Deploy and Test

```bash
cd terraform && terraform init && terraform apply
# or
cd pulumi && npm install && pulumi login --local && pulumi stack init dev && pulumi up
```

Notice how much faster that was than Part 1 — no image build, no push, and no waiting for a load balancer to decide your container is healthy.

Then the same `curl` commands as Part 1, against the new URL:

```bash
BASE_URL="$(terraform output -raw base_url)"     # or: pulumi stack output baseUrl

curl "$BASE_URL/health"
curl "$BASE_URL/"

../../scripts/smoke-test.sh "$BASE_URL"
```

The _same_ smoke test script as Part 1, unchanged, against a completely different deployment. The `platform` field now reads `lambda` instead of `ecs`, while `runtime` reports a Node version in both parts — which is exactly the point: the language didn't change, the deployment model did.

Now two experiments, because they're the evidence for Step 0.

### The first request is slow

```bash
time curl -s "$BASE_URL/" > /dev/null
time curl -s "$BASE_URL/" > /dev/null
```

The first call pays for AWS starting an execution environment for your function — a **cold start**. The second hits the environment that's now warm. Wait ten or fifteen minutes and you'll pay it again, because nothing was running in between. (A zip on a managed runtime is about the cheapest cold start there is; a container-image function has to pull the image first, and takes substantially longer.)

Then ask yourself what that means for a user-facing API that gets occasional traffic — and what Part 1's always-running container was really buying you.

### Changing the code

Edit `backend/index.mjs`, add a field to the response, and re-deploy:

```bash
terraform apply     # or: pulumi up
```

It should be live in seconds. If your apply reports no changes at all, go back and re-read the source-hash TODO in Step 2 — you've just found the bug it was warning about, which is a better way to learn it than being told.

## Cleanup

Part 2 is nearly free to leave running — there's no load balancer and no idle container, and at this scale Lambda plus API Gateway cost fractions of a cent. (Lambda's free tier is permanent; the HTTP API one only covers your first year, so don't rely on "free tier" as the reason.) Tear it down anyway, both to keep the account tidy and because a `destroy` that works is a check on your config:

```bash
terraform destroy     # or: pulumi destroy
```

Then confirm nothing survived. The log group is the one thing here that can outlive a `destroy`:

```bash
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/cis1912-hw3-part2 \
  --query 'logGroups[].{name:logGroupName,retention:retentionInDays}'
```

If that still prints a group, Terraform or Pulumi never owned it — Lambda created it for you on the first invocation, with retention set to "never expire". Re-read the log-group TODO: the name has to match exactly, or you spent the whole assignment managing an empty group while the real one filled up next to it.

And if you haven't destroyed **Part 1** yet, do that right now. That one is on the clock.

## Tips

- **`{"message":"Internal Server Error"}` with nothing in the logs** — read Step 3 again. It's the missing `aws_lambda_permission` approximately every time.
- **`{"message":"Not Found"}`** is API Gateway telling you no route matched. Check your route keys; if `/health` works and `/` doesn't, you're missing the root route.
- **`Runtime.HandlerNotFound`, or an import error on a cold start**, means the handler string doesn't match what's actually in the zip. The format is `<file basename>.<exported name>`, relative to the root of the package — so a file at `backend/index.mjs` zipped from `backend/` is `index`, not `backend/index`.
- **Function logs:**
  ```bash
  aws logs tail /aws/lambda/cis1912-hw3-part2 --follow
  ```
  Cold starts appear here as `INIT_START`, and every invocation gets a `REPORT` line with its duration and billed memory. Compare a cold invocation's duration to a warm one.
- **Invoke the function without API Gateway in the way**, to work out which of the two is broken:
  ```bash
  aws lambda invoke --function-name cis1912-hw3-part2 \
    --payload '{"version":"2.0","rawPath":"/health","requestContext":{"http":{"method":"GET","path":"/health"}}}' \
    --cli-binary-format raw-in-base64-out /dev/stdout
  ```
- **Check what you actually shipped.** The zip is a real file you can look at:
  ```bash
  unzip -l build/function.zip   # from inside part-2/terraform
  ```
