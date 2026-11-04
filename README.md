# Submission

Create your own (new) repo, clone this one, and point the remote at yours:

```bash
$ git remote set-url origin <your new origin>
```

# Before You Start

This is the first homework that touches a real cloud account and spends real money, so get setup out of the way first.

## You'll need

- An AWS account with credentials configured locally. Verify:

  ```bash
  aws sts get-caller-identity
  ```

  If that prints an account number you're set. Fix it before going further — every downstream error is a confusing one.

- **Docker**, running — Part 1 builds a container image locally before pushing it to AWS. Part 2 needs no Docker.
- **Terraform** (≥ 1.6) _or_ **Pulumi** (≥ 3.100) + **Node.js** (≥ 20). You only need one.

## Pick one: Terraform or Pulumi

Each part ships a `terraform/` and a `pulumi/` directory describing identical infrastructure. **Complete one of them** — your choice:

- `terraform/` uses HCL, a language that exists only for this purpose.
- `pulumi/` uses TypeScript, with loops, functions, and types you already know.

Both are dominant in this space and the industry is genuinely split, so the lesson is the one they share: your infrastructure is a program, kept in version control, applied by a machine. Use the **same** tool for both parts, so Part 2 can lean on Part 1.

## Part 2 is optional

Optional, but highly recommended — it's where you learn serverless deployment with Lambda.

## What you do and don't edit

Both backends are **already written**, and both just report the current time:

- [`part-1/backend/`](./part-1/backend) — a dependency-free Node HTTP server, plus a finished `Dockerfile`.
- [`part-2/backend/`](./part-2/backend) — one JavaScript file exporting one function, for Lambda's Node.js runtime.

Same language, same major version, two separate implementations — because the platforms want different shapes of program: Part 1 listens on a port, Part 2 exports a function AWS calls. Holding the language constant is deliberate, so every difference you observe between the parts comes from the deployment model.

[`scripts/smoke-test.sh`](./scripts/smoke-test.sh) tests either deployment with nothing but `curl`; you shouldn't need to change it either.

Your job is the infrastructure, and only the infrastructure.
