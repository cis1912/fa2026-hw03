# Part 1: A Backend on ECS Fargate

In HW1 you ran containers on your own machine — `docker run`, then Docker Compose to wire a few together. In HW2 you stopped describing *steps* and started describing *desired state*: you handed Kubernetes a description of what should exist, and a control loop kept the cluster honest to it.

Both of those stopped at the edge of your laptop. A real deployment needs things your laptop doesn't have: a public address, a load balancer, somewhere to store images, and permissions governing who may do what. In the AWS console all of that is available through a few dozen web forms — and this is genuinely how a lot of infrastructure gets built, once, by one person, on a Tuesday afternoon. Six months later nobody remembers which checkboxes were ticked, staging doesn't quite match production, and the person who set it up has graduated.

**Infrastructure as Code** applies HW2's lesson to the cloud itself. You write down what should exist, in files, in version control; a tool reads your description, compares it to reality, and makes reality match. Nobody clicks anything. The description *is* the documentation, code review applies to your network topology, and standing up a second identical copy means running one command.

The application is deliberately trivial — it tells you the time — so that nothing in this homework is about application code. Every interesting decision you make is infrastructure.

## Step 0: Why State?

> 🤔 This is something we'd like you to think about...

In [RESPONSE.md](../RESPONSE.md), write your response to the following question. The [Terraform state docs](https://developer.hashicorp.com/terraform/language/state/purpose) or [Pulumi state docs](https://www.pulumi.com/docs/concepts/state/) will be useful here, depending on which tool you picked.

> Terraform and Pulumi both keep a *state file*. Why is state necessary at all — why can't the tool just inspect your AWS account and diff it against your configuration? What does `terraform plan` / `pulumi preview` give you that clicking through the AWS console doesn't?

## Step 1: Getting Oriented

Pick your tool — [`terraform/`](./terraform) or [`pulumi/`](./pulumi) — and work in that directory for the rest of this part. The two describe identical infrastructure; completing either one completes the assignment.

The application lives in [`backend/`](./backend): one JavaScript file with no dependencies, and a `Dockerfile`. You shouldn't need to touch either. Part 2 deploys the same job in the same language, so anything that differs between the two parts is infrastructure, not code.

Some of the infrastructure is already finished, and worth reading before you write anything:

| Terraform | Pulumi | |
|---|---|---|
| `versions.tf` | `Pulumi.yaml`, `config.ts` | Provider and configuration setup. Terraform's version explains where your image comes from — read it. |
| `network.tf` | `network.ts` | The VPC and subnets. We borrow the account's default VPC; building one is a homework of its own. |
| `alb.tf` | `alb.ts` | The load balancer, target group, and listener. |
| `iam.tf` | `iam.ts` | The task execution role. |
| `outputs.tf` | `index.ts` | The values you get back after deploying, including `base_url` / `baseUrl`. |

The load balancer and the IAM role are given to you. They're necessary, and worth reading once — Step 4 points out the two things in them that generalise — but writing them out is boilerplate rather than the lesson here.

Everything else carries `TODO`s. Each one says what's needed and hints at where to look; none expect you to guess a magic string you've never seen. Work through them in the order below, since the resources depend on each other in roughly that order.

If you want the whole target shape at once: an ECR repository holding your image, a load balancer with a public DNS name, a target group it forwards to, an ECS service keeping one copy of your container alive and registered with that target group, two security groups controlling who can talk to whom, and an IAM role letting ECS pull your image. The load balancer and the role already exist — what you're writing is the image, the security groups, and the ECS half.

## Step 2: The Image

Fill in the TODOs in `image.tf` / `image.ts`.

Your container image has to live in a registry that AWS can pull from. ECS *can* pull from Docker Hub, but your own images generally belong somewhere private, inside your own account, with IAM deciding who may push and pull — and **ECR** (Elastic Container Registry) is AWS's answer to that. You'll declare a repository for it here.

The notable part is that your IaC tool also performs the `docker build` and the `docker push` — look at the parts of this file that are already written. You never run those commands yourself, and you never copy an image URI around by hand: the repository you declare, the build that produces the image, and the deployment that consumes it are one dependency graph. Change the app, re-apply, and the right things rebuild in the right order.

## Step 3: Security Groups

Fill in the TODOs in `security.tf` / `security.ts`.

A security group is a stateful firewall attached to a network interface. You need two, and the interesting part is the second: the tasks should accept traffic **only from the load balancer**, which you express by referencing the load balancer's security group rather than an IP range. Two rules, one sentence each — and that's the difference between "the internet can reach my app through the front door" and "the internet can reach my app, and also reach around the side."

## Step 4: Read the Load Balancer and the Role

Nothing to write here — `alb.tf` / `alb.ts` and `iam.tf` / `iam.ts` are already done. Two things in them generalise well beyond this assignment, so give them a read before continuing:

- **The load balancer exists because your task's address doesn't last.** Fargate hands each task a fresh private IP, so something stable has to sit in front of it. The target group is the list of places to forward to, and its health check — pointed at the backend's `/health` — decides which tasks are currently fit to serve. Note `target_type = "ip"`: tasks in `awsvpc` mode register by IP rather than as EC2 instances, and a target group with the wrong target type is a classic cause of a service that never turns healthy.
- **The execution role belongs to the platform, not your app.** Before your container starts, the ECS agent has to pull the image and create a log stream on your behalf, and AWS requires explicit permission for that. Notice that the role answers two separate questions — *who may assume this role* (the trust policy) and *what may they then do* (the attached policy). AWS always asks both, and conflating them is a common source of confusion.

## Step 5: The Cluster, the Task, and the Service

Fill in the TODOs in `ecs.tf` / `ecs.ts`. This is the heart of it, and it maps almost one-to-one onto HW2:

| ECS | ≈ Kubernetes |
|---|---|
| Task definition | Pod spec — the image, port, env vars, resource limits |
| Task | Pod — one running copy |
| Service | Deployment — keeps N copies alive, replaces dead ones |
| Cluster | the cluster, except with Fargate there are no servers in it |

The task definition is where you'll spend the most time: it's a container spec in JSON, and it needs the image, the port, `PLATFORM=ecs` in the environment (the app reads that and reports it straight back to you, which is how `curl` will tell you which half of this homework answered), and a log configuration pointing at the log group that's already declared for you.

Read the comment about pinning the image **by digest** rather than by tag. It explains a class of bug that will otherwise cost you an afternoon somewhere down the line.

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

The first run takes a few minutes — most of it building and pushing the image. Then the ECS service has to start a task and the load balancer has to health-check it before it'll send traffic. A `503` for the first minute or two is normal; a `503` for five minutes is a problem, and the [Tips](#tips) below are where to start.

Do read the plan/preview output before confirming it. Learning to skim a plan for "wait, why is it replacing *that*?" is most of the skill this assignment is teaching.

## Step 7: Test It

Every one of these is just `curl` against the URL your deployment printed:

```bash
# Terraform
BASE_URL="$(terraform output -raw base_url)"
# Pulumi
BASE_URL="$(pulumi stack output baseUrl)"

curl "$BASE_URL/health"
curl "$BASE_URL/"
```

The second one returns the current time, along with a `platform` field that should say `ecs` — that's the environment variable you set in the task definition coming back to you, confirming you're talking to the thing you think you're talking to. Call it twice and the timestamp should advance.

Or run all of it at once:

```bash
../../scripts/smoke-test.sh "$BASE_URL"
```

That script is pure `curl`; it prints every command it runs, so you can pull any single step out of it to debug by hand. All three checks should pass before you move on to Part 2.

## Step 8: Change Something

Worth doing once, because it's the actual payoff. Edit `backend/server.mjs` — add a field to the JSON response, say — and re-apply:

```bash
terraform apply     # or: pulumi up
```

Watch what happens: your tool notices the source changed, rebuilds the image, pushes it, sees that the new digest differs from the deployed one, writes a new task definition revision, and rolls the service over to it. The load balancer keeps serving the old task until the new one is healthy. You described none of that sequencing — you changed a source file and said "make it so."

```bash
curl "$BASE_URL/"
```

## Cleanup

**Do this now, not later** — the load balancer bills by the hour whether you're using it or not.

```bash
terraform destroy     # or: pulumi destroy
```

Confirm nothing survived:

```bash
aws elbv2 describe-load-balancers --query 'LoadBalancers[].LoadBalancerName'
aws ecs list-clusters
```

If `destroy` complains that the ECR repository isn't empty, you skipped one of the TODOs in `image.tf` / `image.ts` — go read it again.

## Tips

- **`503` from the load balancer** means it has no healthy targets. Look at the target group's health in the console, or:
  ```bash
  aws ecs describe-services --cluster <cluster> --services <service> \
    --query 'services[0].events[:5]'
  ```
  The service's recent events usually say exactly what's wrong, in English.
- **The task starts and immediately dies.** Read the container's logs — that's what the log group is for:
  ```bash
  aws logs tail /ecs/cis1912-hw3-part1 --follow
  ```
- **The task never starts at all** (stuck in `PENDING`, or stopped with a pull error) is usually one of two things: the execution role can't pull from ECR, or the task has no route to ECR because it didn't get a public IP.
- **`terraform plan` wants to rebuild the image every time.** Check the `triggers` hash in `image.tf` — if it's seeing a file that changes on its own, that'd do it.
- **Reading a plan**: `~` means update in place, `-/+` means destroy and recreate. The second is worth pausing over, always.
- **No default VPC?** Some newer accounts ship without one. `aws ec2 create-default-vpc` fixes that.
