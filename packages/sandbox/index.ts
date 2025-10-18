import Sandbox from "@e2b/code-interpreter";
import path from "node:path";
import {
  collectLocalFiles,
  filesToDbRecords,
  filesToSandboxPayload,
  getPublicURL,
  runInBackground,
} from "./utils";
import { db, SandboxStatus } from "@webgen/db";

const TIMEOUT_MS = 60000 * 30;
export const REMOTE_PROJECT_DIR = "/home/user/e2b-react";

const PROJECT_DIR = path.resolve(
  process.cwd(),
  "../../packages/sandbox/e2b-react",
);
const PORT = 5173;

export async function writeFileToSandbox(
  sandboxId: string,
  relativePath: string,
  content: string,
) {
  // Connect to an already running sandbox for this project
  const E2B_API_KEY = process.env.E2B_API_KEY;
  if (!E2B_API_KEY) throw new Error("E2B_API_KEY is not set");

  const sbx = await Sandbox.connect(sandboxId);
  const posixRel = relativePath.split(path.sep).join("/");
  const remotePath = `${REMOTE_PROJECT_DIR}/${posixRel}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const arrayBuffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(arrayBuffer).set(data);
  await sbx.files.write([{ path: remotePath, data: arrayBuffer }]);
}

export class SandboxManager {
  private sbx: Sandbox | undefined = undefined;
  private projectId: string;
  private sandboxId: string | undefined = undefined;
  private apiKey: string;

  constructor(projectId: string, apiKey: string) {
    this.projectId = projectId;
    this.apiKey = apiKey;
  }

  public async initializeSandbox() {
    try {
      this.sbx = await Sandbox.create({
        apiKey: this.apiKey,
        timeoutMs: TIMEOUT_MS,
      });

      console.log("Waiting for public URL...");
      const url = await getPublicURL(this.sbx, PORT);
      console.log("Public URL:", url);

      const sandbox = await db.sandbox.create({
        data: {
          id: this.sbx.sandboxId,
          url,
          status: SandboxStatus.PENDING,
          projectId: this.projectId,
          expiresAt: new Date(Date.now() + 60000 * 30),
        },
      });
      this.sandboxId = sandbox.id;
      return url;
    } catch (error) {
      console.error({ error });
      await this.sbx?.kill();
      this.sbx = undefined;
    }
  }

  public async uploadFiles() {
    try {
      console.log("Uploading project to sandbox...");
      if (!this.sbx) {
        throw "no sandbox";
      }
      console.log(`Using local project dir: ${PROJECT_DIR}`);
      const files = await collectLocalFiles(PROJECT_DIR);
      if (files.length === 0)
        throw new Error("No files to upload from e2b-react");
      await this.sbx.files.write(filesToSandboxPayload(files));

      console.log("Installing dependencies in sandbox...");
      await this.sbx.commands.run('bash -lc "npm i --no-fund --no-audit"', {
        cwd: REMOTE_PROJECT_DIR,
      });

      console.log("Starting Vite dev server in background...");
      runInBackground(
        this.sbx,
        `bash -lc "npm run dev -- --host 0.0.0.0 --port ${PORT} --strictPort"`,
        REMOTE_PROJECT_DIR,
      );
      console.log("process started");
      console.log("Persisting project files to database...");
      await db.$transaction(async (tx) => {
        await tx.file.deleteMany({ where: { projectId: this.projectId } });
        await tx.file.createMany({
          data: filesToDbRecords(this.projectId, files),
        });
      });

      await db.sandbox.update({
        where: { id: this.sandboxId },
        data: {
          status: SandboxStatus.RUNNING,
        },
      });
    } catch (error) {
      console.error({ error });
      await db.sandbox.update({
        where: { id: this.sandboxId },
        data: {
          status: SandboxStatus.FAILED,
        },
      });
    }
  }
}
