import "server-only";

import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Codex } from "@openai/codex-sdk";
import { runBoundedCodexInference } from "@/lib/inference/codex-core";

export type InferenceMode = "codex" | "mock";

export type GroundedAnswer = {
  text: string;
  mode: InferenceMode;
  model: string | null;
};

const CODEX_TIMEOUT_MS = 60_000;
const CODEX_WORKING_DIRECTORY = join(tmpdir(), "ask-me-codex-runtime");
const CODEX_ENV_ALLOWLIST = [
  "HOME",
  "CODEX_HOME",
  "PATH",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "SSL_CERT_FILE",
  "SSL_CERT_DIR",
  "NODE_EXTRA_CA_CERTS",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "no_proxy",
] as const;

function codexEnvironment() {
  return Object.fromEntries(
    CODEX_ENV_ALLOWLIST.flatMap((name) => {
      const value = process.env[name];
      return value ? [[name, value]] : [];
    }),
  );
}

function inferenceMode(): InferenceMode {
  const configured = process.env.ASK_ME_INFERENCE_MODE?.trim().toLowerCase();
  if (!configured || configured === "codex") return "codex";
  if (configured === "mock") return "mock";
  throw new Error("ASK_ME_INFERENCE_MODE must be either codex or mock.");
}

function mockAnswer(context: string): GroundedAnswer {
  return {
    text: `Development mock answer — no model call was made. Based on the published knowledge:\n\n${context}`,
    mode: "mock",
    model: null,
  };
}

export async function generateGroundedAnswer(
  question: string,
  context: string,
): Promise<GroundedAnswer> {
  if (inferenceMode() === "mock") return mockAnswer(context);

  await mkdir(CODEX_WORKING_DIRECTORY, { recursive: true });
  const codex = new Codex({
    env: codexEnvironment(),
    configOverrides: ["mcp_servers={}"],
  });
  const thread = codex.startThread({
    workingDirectory: CODEX_WORKING_DIRECTORY,
    skipGitRepoCheck: true,
    sandboxMode: "read-only",
    approvalPolicy: "never",
    networkAccessEnabled: false,
    webSearchMode: "disabled",
    modelReasoningEffort: "low",
    threadSource: "ask-me-local-demo",
  });
  const text = await runBoundedCodexInference(
    question,
    context,
    thread,
    AbortSignal.timeout(CODEX_TIMEOUT_MS),
  );

  return { text, mode: "codex", model: null };
}
