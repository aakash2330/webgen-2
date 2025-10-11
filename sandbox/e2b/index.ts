import path from "node:path";
import fs from "node:fs/promises";
import { Sandbox } from "@e2b/code-interpreter";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function collectLocalFiles(
  rootDir: string,
): Promise<Array<{ remotePath: string; data: Uint8Array }>> {
  const ignoredNames = new Set([
    "node_modules",
    ".git",
    ".cache",
    "dist",
    "build",
  ]);
  const files: Array<{ remotePath: string; data: Uint8Array }> = [];

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoredNames.has(entry.name)) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const rel = path.relative(rootDir, fullPath);
        const posixRel = rel.split(path.sep).join("/");
        const remotePath = `/home/user/e2b-react/${posixRel}`;
        const data = await fs.readFile(fullPath);
        files.push({ remotePath, data });
      }
    }
  }

  await walk(rootDir);
  return files;
}

async function ensureProjectUploaded(sbx: Sandbox, projectDir: string) {
  const files = await collectLocalFiles(projectDir);
  if (files.length === 0) throw new Error("No files to upload from e2b-react");
  await sbx.files.write(
    files.map((f) => {
      const arrayBuffer = new ArrayBuffer(f.data.byteLength);
      new Uint8Array(arrayBuffer).set(f.data);
      return { path: f.remotePath, data: arrayBuffer };
    }),
  );
}

async function runInBackground(sbx: Sandbox, cmd: string, cwd?: string) {
  return sbx.commands.run(cmd, {
    background: true,
    cwd,
    onStdout: (d) => {
      process.stdout.write(d);
    },
    onStderr: (d) => {
      process.stderr.write(d);
    },
  });
}

async function getPublicURL(
  sbx: Sandbox,
  port: number,
  attempts = 60,
): Promise<string> {
  const anySbx = sbx as any;
  for (let i = 0; i < attempts; i++) {
    try {
      if (typeof anySbx.getHost === "function") {
        const url = await anySbx.getHost(port);
        if (url) return url;
      }
    } catch {
      // ignore and retry
    }
    await sleep(1000);
  }
  throw new Error("Timed out waiting for public URL");
}

async function main() {
  if (!process.env.E2B_API_KEY) {
    console.warn(
      "E2B_API_KEY is not set. Set it in your environment for authentication.",
    );
  }

  const projectDir = path.resolve(__dirname + "/e2b-react");
  const remoteProjectDir = "/home/user/e2b-react";
  const port = 5173;

  const sbx = await Sandbox.create({ timeoutMs: 60000 * 30 });

  console.log("Uploading project to sandbox...");
  await ensureProjectUploaded(sbx, projectDir);

  console.log("Installing dependencies in sandbox...");
  await sbx.commands.run('bash -lc "npm i --no-fund --no-audit"', {
    cwd: remoteProjectDir,
  });

  console.log("Starting Vite dev server...");
  await runInBackground(sbx, 'bash -lc "npm run dev"', remoteProjectDir);

  console.log("Waiting for public URL...");
  const url = await getPublicURL(sbx, port);
  console.log("Public URL:", url);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
