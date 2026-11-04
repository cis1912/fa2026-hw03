# The image Part 1 deploys. You do not need to change this file.
#
# There's no dependency install step and no multi-stage build, because the app
# has no dependencies -- it's Node's standard library only. That keeps the build
# fast, which matters here: your IaC rebuilds this image on every apply where
# the source changed, and it builds for linux/amd64, which may mean emulation on
# an Apple Silicon laptop.
#
# Node 22 to match the Lambda runtime Part 2 uses, so the only thing differing
# between the two parts is how the code gets deployed.

FROM public.ecr.aws/docker/library/node:22-slim

WORKDIR /app
COPY server.mjs .

# Don't run as root. The official Node images ship an unprivileged `node` user
# for exactly this.
USER node

ENV PORT=8000 \
    NODE_ENV=production
EXPOSE 8000

CMD ["node", "server.mjs"]
