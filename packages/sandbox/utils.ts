import path from "node:path";
import fs from "node:fs/promises";
import { Sandbox } from "@e2b/code-interpreter";

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type LocalFile = {
  remotePath: string;
  relativePath: string;
  data: Uint8Array;
};

export async function collectLocalFiles(
  rootDir: string,
): Promise<Array<LocalFile>> {
  const ignoredNames = new Set([
    "node_modules",
    ".git",
    ".cache",
    "dist",
    "build",
  ]);
  const files: Array<LocalFile> = [];

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
        files.push({ remotePath, relativePath: posixRel, data });
      }
    }
  }

  await walk(rootDir);
  return files;
}

export async function ensureProjectUploaded(sbx: Sandbox, projectDir: string) {
  const files = await collectLocalFiles(projectDir);
  if (files.length === 0) throw new Error("No files to upload from e2b-react");
  await sbx.files.write(filesToSandboxPayload(files));
}

export async function runInBackground(sbx: Sandbox, cmd: string, cwd?: string) {
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

export async function getPublicURL(
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

export async function createSandbox() {}

export function filesToSandboxPayload(files: Array<LocalFile>) {
  return files.map((f) => {
    const arrayBuffer = new ArrayBuffer(f.data.byteLength);
    new Uint8Array(arrayBuffer).set(f.data);
    return { path: f.remotePath, data: arrayBuffer };
  });
}

export function filesToDbRecords(projectId: string, files: Array<LocalFile>) {
  const decoder = new TextDecoder("utf-8");
  return files.map((f) => ({
    projectId,
    path: f.relativePath,
    // Store as UTF-8 string directly in JSON column
    content: decoder.decode(f.data),
    lastModified: new Date(),
    isDeleted: false,
  }));
}
