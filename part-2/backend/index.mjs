/**
 * The same backend as Part 1 (it tells you the time) written for Lambda's
 * Node.js runtime instead of packaged as a container.
 *
 * Nothing in this directory is homework; you never need to edit it. Notice what
 * isn't here, though, because it's the whole point of this part: no HTTP server,
 * no port to listen on, no Dockerfile, and no dependencies. AWS supplies the
 * runtime and hands you one request at a time as a plain JavaScript object.
 *
 * `event` arrives in API Gateway's payload format 2.0, which your
 * infrastructure configures. The return value is turned back into an HTTP
 * response.
 */

export const handler = async (event) => {
  const path = event?.requestContext?.http?.path ?? event?.rawPath ?? "/";

  const json = (statusCode, payload) => ({
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (path === "/health") {
    return json(200, { status: "ok" });
  }

  const now = new Date();
  return json(200, {
    time: now.toISOString(),
    epoch_ms: now.getTime(),
    runtime: `nodejs-${process.version}`,
    platform: process.env.PLATFORM ?? "unknown",
    instance: process.env.AWS_LAMBDA_LOG_STREAM_NAME ?? "unknown",
  });
};
