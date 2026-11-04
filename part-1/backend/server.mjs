/**
 * A backend that tells you the time. That's it.
 *
 * Nothing in this directory is homework; you never need to edit it. It's this
 * small so that nothing about HW3 is about application code -- every
 * interesting decision is in the infrastructure. No dependencies either, just
 * Node's built-in http module, which keeps the Docker build fast.
 *
 * Part 2 deploys the same job in the same language as a Lambda function, and
 * that file looks quite different. Worth comparing once you get there.
 */

import { createServer } from "node:http";
import { hostname } from "node:os";

const PORT = Number(process.env.PORT ?? 8000);

// The infrastructure you write sets this, so a response tells you which of your
// two deployments answered it.
const PLATFORM = process.env.PLATFORM ?? "unknown";

const server = createServer((req, res) => {
  const { pathname } = new URL(
    req.url,
    `http://${req.headers.host ?? "localhost"}`,
  );

  const json = (status, payload) => {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    });
    res.end(body);
  };

  // The load balancer polls this one, and only sends real traffic to containers
  // that answer 200.
  if (pathname === "/health") {
    json(200, { status: "ok" });
    return;
  }

  const now = new Date();
  json(200, {
    time: now.toISOString(),
    epoch_ms: now.getTime(),
    runtime: `nodejs-${process.version}`,
    platform: PLATFORM,
    instance: hostname(),
  });
});

server.listen(PORT, () => console.log(`listening on :${PORT}`));
