import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import test from "node:test";
import { fileURLToPath } from "node:url";

async function getAvailablePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  server.close();
  await once(server, "close");
  return port;
}

async function waitForServer(url: string, processOutput: string[]) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Next.js is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next.js did not start in time.\n${processOutput.join("")}`);
}

async function stopApplication(application: ChildProcess) {
  const exit = once(application, "exit");
  application.kill("SIGTERM");
  await Promise.race([exit, new Promise((resolve) => setTimeout(resolve, 5_000))]);
}

test("Outlook candidates remain private until explicit publication", async () => {
  const port = await getAvailablePort();
  const origin = `http://127.0.0.1:${port}`;
  const nextBinary = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
  const output: string[] = [];
  const adminSecret = "integration-test-admin-secret";
  const application = spawn(
    process.execPath,
    [nextBinary, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        ASK_ME_ADMIN_SECRET: adminSecret,
        ASK_ME_INFERENCE_MODE: "mock",
      },
    },
  );

  application.stdout?.on("data", (chunk) => output.push(chunk.toString()));
  application.stderr?.on("data", (chunk) => output.push(chunk.toString()));

  try {
    await waitForServer(`${origin}/api/health`, output);

    const anonymous = await fetch(`${origin}/api/admin/outlook/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "financial agentic" }),
    });
    assert.equal(anonymous.status, 401);

    const login = await fetch(`${origin}/api/admin/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: adminSecret }),
    });
    assert.equal(login.status, 200);
    const adminCookie = (login.headers.get("set-cookie") ?? "").split(";")[0];

    const importedResponse = await fetch(`${origin}/api/admin/outlook/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ query: "resolution compliance invoice" }),
    });
    assert.equal(importedResponse.status, 200);
    assert.equal(importedResponse.headers.get("cache-control"), "no-store");
    const importedPayload = await importedResponse.json();
    assert.ok(importedPayload.entries.length > 0);

    const imported = importedPayload.entries[0];
    assert.equal(imported.sourceType, "outlook");
    assert.equal(imported.published, false);
    assert.equal(typeof imported.sourceLabel, "string");
    assert.equal(typeof imported.sourceDate, "string");

    const beforePublish = await fetch(`${origin}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "What does the Resolution agent do with invoice exceptions?" }),
    });
    const beforePayload = await beforePublish.json();
    assert.equal(beforePayload.sources.some((source: { id: string }) => source.id === imported.id), false);
    assert.equal(JSON.stringify(beforePayload).includes(imported.sourceLabel), false);

    const publish = await fetch(`${origin}/api/admin/knowledge/${imported.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ published: true }),
    });
    assert.equal(publish.status, 200);

    const afterPublish = await fetch(`${origin}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "What does the Resolution agent do with invoice exceptions?" }),
    });
    const afterPayload = await afterPublish.json();
    assert.equal(afterPayload.mode, "mock");
    assert.ok(afterPayload.sources.some((source: { id: string }) => source.id === imported.id));
    assert.equal(JSON.stringify(afterPayload).includes(imported.sourceLabel), false);

    const duplicate = await fetch(`${origin}/api/admin/outlook/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ query: "resolution compliance invoice" }),
    });
    const duplicatePayload = await duplicate.json();
    assert.equal(duplicatePayload.entries.length, 0);
    assert.ok(duplicatePayload.duplicatesSkipped > 0);
  } finally {
    await stopApplication(application);
  }
});
