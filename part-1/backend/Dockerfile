# The image Part 1 deploys. You do not need to change this file.
#
# No dependency install and no multi-stage build, because the app has no
# dependencies -- Node's standard library only. That keeps the build fast, which
# matters: your IaC rebuilds this on every apply where the source changed, for
# linux/amd64, which may mean emulation on an Apple Silicon laptop.
#
# Node 22 matches the Lambda runtime Part 2 uses, so the only thing differing
# between the parts is how the code gets deployed.

FROM public.ecr.aws/docker/library/node:22-slim

WORKDIR /app
COPY server.mjs .

# Don't run as root; the official Node images ship a `node` user for this.
USER node

ENV PORT=8000 \
    NODE_ENV=production
EXPOSE 8000

CMD ["node", "server.mjs"]
