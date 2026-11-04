# Submission

To get started, create your own (new) repo. Clone this repository and set the remote to point to your new repo:

```bash
$ git remote set-url origin <your new origin>
```

# Before You Start

This is the first homework that touches a real cloud account and spends real money. A few minutes of setup now will save you a lot of confusion later.

## You'll need

- An AWS account, and credentials configured locally. Check that they work:

  ```bash
  aws sts get-caller-identity
  ```

  If that prints an account number, you're set. If it doesn't, fix this before going any further — every error you'd hit downstream is a confusing one.

- **Docker**, running — for Part 1, which builds a container image on your machine before pushing it to AWS. Part 2 needs no Docker at all.
- **Terraform** (≥ 1.6) _or_ **Pulumi** (≥ 3.100) + **Node.js** (≥ 20). You only need one of them — see below.

## Pick one: Terraform or Pulumi

Each part ships two starter directories, `terraform/` and `pulumi/`, that describe exactly the same infrastructure. **Complete one of them.** Which one is entirely up to you:

- `terraform/` uses HCL, a language that exists only for this purpose.
- `pulumi/` uses TypeScript, with loops, functions, and types you already know.

They're the two dominant tools in this space and the industry is genuinely split, so the useful lesson is the one both share: your infrastructure is a program, kept in version control, applied by a machine. Whichever you pick, use the _same_ tool for both parts so Part 2 can lean on what you built in Part 1.

## Part 2 is optional

Part 2 of this assignment is optional, but we highly recommend going through it to learn about serverless deployments using lambda!

## What you do and don't edit

Both backends are **already written**, and neither one is interesting on purpose — each just reports the current time:

- [`part-1/backend/`](./part-1/backend) — a dependency-free Node HTTP server, plus a finished `Dockerfile`.
- [`part-2/backend/`](./part-2/backend) — one JavaScript file exporting one function, for Lambda's Node.js runtime.

Both are Node, on the same major version, and they're _still_ separate implementations — because the two platforms want different shapes of program: Part 1's creates a server and listens on a port, Part 2's exports one function for AWS to call. That the language is held constant is deliberate; it means every difference you observe between the two parts comes from the deployment model. Part 2's README opens with that comparison.

[`scripts/smoke-test.sh`](./scripts/smoke-test.sh) tests either deployment with nothing but `curl`, and you shouldn't need to change it either.

Your job in this homework is the infrastructure, and only the infrastructure.
