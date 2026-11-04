# Part 1: A Backend on ECS Fargate

HW2 taught you to describe *desired state* rather than steps, and let a control loop keep reality honest to it. **Infrastructure as Code** applies that to the cloud itself: you write down what should exist, in version control; a tool diffs it against reality and makes reality match.

The alternative is the AWS console's few dozen web forms — which is genuinely how a lot of infrastructure gets built, once, by one person, on a Tuesday afternoon, after which nobody remembers which checkboxes were ticked. Written down instead, the description *is* the documentation, code review applies to your network topology, and a second identical copy is one command away.

The application is deliberately trivial — it tells you the time — so every interesting decision here is infrastructure.

## Step 0: Why State?

> 🤔 This is something we'd like you to think about...

Answer this in [RESPONSE.md](../RESPONSE.md). The [Terraform state docs](https://developer.hashicorp.com/terraform/language/state/purpose) or [Pulumi state docs](https://www.pulumi.com/docs/concepts/state/) will help, depending on your tool.

> Terraform and Pulumi both keep a *state file*. Why is state necessary at all — why can't the tool just inspect your AWS account and diff it against your configuration? What does `terraform plan` / `pulumi preview` give you that clicking through the AWS console doesn't?

## Step 1: Getting Oriented

Pick your tool — [`terraform/`](./terraform) or [`pulumi/`](./pulumi) — and stay in that directory for this part. Either one completes the assignment.

The app lives in [`backend/`](./backend): one JavaScript file, no dependencies, plus a `Dockerfile`. You shouldn't need to touch either.

Some infrastructure is already finished, and worth reading first:

| Terraform | Pulumi | |
|---|---|---|
| `versions.tf`, `variables.tf` | `Pulumi.yaml`, `config.ts` | Provider and configuration setup. Terraform's `versions.tf` explains where your image comes from — read it. |
| `network.tf` | `network.ts` | The VPC and subnets. We borrow the account's default VPC; building one is a homework of its own. |
| `alb.tf` | `alb.ts` | The load balancer, target group, and listener. |
| `iam.tf` | `iam.ts` | The task execution role. |
| `outputs.tf` | `index.ts` | What you get back after deploying, including `base_url` / `baseUrl`. |

The load balancer and IAM role are given to you: necessary, worth reading once (Step 4 covers the two things in them that generalise), but boilerplate to write.

Everything else carries `TODO`s saying what's needed and hinting at where to look. Work through them in the order below, since the resources depend on each other in roughly that order.

The target shape: an ECR repository holding your image, a load balancer with a public DNS name, a target group it forwards to, an ECS service keeping one copy of your container alive and registered with that target group, two security groups, and an IAM role letting ECS pull your image. You're writing the image, the security groups, and the ECS half.

## Step 2: The Image

Fill in the TODOs in `image.tf` / `image.ts`.

Your image needs a registry AWS can pull from. ECS *can* pull from Docker Hub, but your own images belong inside your own account with IAM deciding who may push and pull — that's **ECR** (Elastic Container Registry), and you declare a repository for it here.

The notable part, already written for you, is that your IaC tool performs the `docker build` and `docker push` too. You never run those commands and never copy an image URI by hand: the repository, the build, and the deployment are one dependency graph.

Read what's written about *change detection*, because the two tools solve it very differently:

**Terraform**: read the two `triggers` blocks and their comments. Neither the build nor the push has any *tracked input* that changes when you edit your source — the image is named `...:v1` either way. Without them, Terraform finds no difference and cheerfully reports no changes while running last week's code.

**Pulumi**: `image.ts` has no equivalent. `awsx.ecr.Image` delegates to a `docker-build` resource whose provider hashes your build context on every preview, so edited source shows up as a diff without you declaring anything — and `imageUri` comes back pinned to the pushed digest rather than the tag.

Either way: "nothing to do" and "nothing changed" are not the same claim, and this is where they come apart.

## Step 3: Security Groups

Fill in the TODOs in `security.tf` / `security.ts`.

A security group is a stateful firewall on a network interface. You need two, and the second is the interesting one: tasks should accept traffic **only from the load balancer**, which you express by referencing the ALB's security group rather than an IP range. That's the difference between "the internet can reach my app through the front door" and "...and also reach around the side."

## Step 4: Read the Load Balancer and the Role

Nothing to write — `alb.tf` / `alb.ts` and `iam.tf` / `iam.ts` are done. Two things in them generalise well beyond this assignment:

- **The load balancer exists because your task's address doesn't last.** Fargate gives each task a fresh private IP, so something stable has to sit in front. The target group is the list of places to forward to, and its health check — pointed at `/health` — decides which tasks are fit to serve. Note `target_type = "ip"`: tasks in `awsvpc` mode register by IP, not as EC2 instances, and the wrong target type is a classic cause of a service that never turns healthy.
- **The execution role belongs to the platform, not your app.** Before your container starts, the ECS agent pulls the image and creates a log stream on your behalf, and AWS requires explicit permission. Notice the role answers two separate questions — *who may assume it* (trust policy) and *what may they then do* (attached policy). AWS always asks both; conflating them is a common source of confusion.

## Step 5: The Cluster, the Task, and the Service

Fill in the TODOs in `ecs.tf` / `ecs.ts`. This is the heart of it, and it maps almost one-to-one onto HW2:

| ECS | ≈ Kubernetes |
|---|---|
| Task definition | Pod spec — image, port, env vars, resource limits |
| Task | Pod — one running copy |
| Service | Deployment — keeps N copies alive, replaces dead ones |
| Cluster | the cluster, except with Fargate there are no servers in it |

The task definition takes the most time: a container spec in JSON needing the image, the port, `PLATFORM=ecs` in the environment (the app reports it straight back, so `curl` tells you which half of this homework answered), and a log configuration pointing at the log group already declared for you.

Read the comment about pinning the image **by digest** rather than by tag — it explains a class of bug that will otherwise cost you an afternoon.

## Step 6: Deploy

### Terraform

```bash
cd terraform
terraform init
terraform plan     # read this before you apply it
terraform apply
```

### Pulumi

```bash
cd pulumi
npm install
pulumi login --local          # keeps state in a file on your machine, no account needed
pulumi stack init dev
pulumi preview                # read this before you up it
pulumi up
```

The first run takes a few minutes, mostly building and pushing the image; then the service has to start a task and the ALB has to health-check it. A `503` for a minute or two is normal, five minutes is a problem — start with the [Tips](#tips).

Do read the plan/preview before confirming. Learning to skim a plan for "wait, why is it replacing *that*?" is most of the skill this assignment teaches.

## Step 7: Test It

All just `curl` against the URL your deployment printed:

```bash
# Terraform
BASE_URL="$(terraform output -raw base_url)"
# Pulumi
BASE_URL="$(pulumi stack output baseUrl)"

curl "$BASE_URL/health"
curl "$BASE_URL/"
```

The second returns the current time plus a `platform` field reading `ecs` — your task definition's environment variable coming back, confirming you're talking to what you think you are. Call it twice and the timestamp should advance. Or all at once:

```bash
../../scripts/smoke-test.sh "$BASE_URL"
```

That script is pure `curl` and prints every command it runs, so you can pull any step out to debug by hand. All three checks should pass before Part 2.

## Step 8: Change Something

Worth doing once; it's the payoff. Edit `backend/server.mjs` — add a field to the JSON response — and re-apply:

```bash
terraform apply     # or: pulumi up
```

Your tool rebuilds, pushes, sees the new digest differs from the deployed one, writes a new task definition revision, and rolls the service over — with the ALB serving the old task until the new one is healthy. You described none of that sequencing; you changed a file and said "make it so."

```bash
curl "$BASE_URL/"
```

## Cleanup

**Do this now, not later** — the load balancer bills by the hour whether you use it or not.

```bash
terraform destroy     # or: pulumi destroy
```

Confirm nothing survived:

```bash
aws elbv2 describe-load-balancers --query 'LoadBalancers[].LoadBalancerName'
aws ecs list-clusters
```

If `destroy` complains the ECR repository isn't empty, you skipped one of the TODOs in `image.tf` / `image.ts`.

## Tips

- **`503` from the load balancer** means no healthy targets. Check the target group's health in the console, or:
  ```bash
  aws ecs describe-services --cluster <cluster> --services <service> \
    --query 'services[0].events[:5]'
  ```
  The service's recent events usually say what's wrong, in English.
- **The task starts and immediately dies.** Read the container's logs — that's what the log group is for:
  ```bash
  aws logs tail /ecs/cis1912-hw3-part1 --follow
  ```
- **The task never starts at all** (stuck `PENDING`, or a pull error) is usually one of two things: the execution role can't pull from ECR, or the task has no route to ECR because it didn't get a public IP.
- **`terraform plan` wants to rebuild the image every time** (Terraform track): check the `triggers` hash in `image.tf` — a file that changes on its own would do it.
- **Reading a plan**: `~` means update in place, `-/+` means destroy and recreate. The second is always worth pausing over.
- **No default VPC?** Some newer accounts ship without one. `aws ec2 create-default-vpc` fixes that.
