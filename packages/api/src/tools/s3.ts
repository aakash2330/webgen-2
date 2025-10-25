import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.S3_BUCKET || "webgen-react";

const s3 = new S3Client({ region: REGION });

export function projectPrefix(projectId: string) {
  return `projects/${projectId}/`;
}

export function projectKey(projectId: string, relativePath: string) {
  const clean = relativePath.replace(/^\/+/, "");
  return projectPrefix(projectId) + clean;
}

export async function getTextObject(key: string): Promise<string> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const anyBody = (res as any).Body;
  if (!anyBody || typeof anyBody.transformToString !== "function") {
    throw new Error("object body empty");
  }
  const body = await anyBody.transformToString();
  return String(body);
}

export async function putTextObject(
  key: string,
  content: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: content,
      ContentType: "text/plain; charset=utf-8",
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function copyObject(
  srcKey: string,
  destKey: string,
): Promise<void> {
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${srcKey}`,
      Key: destKey,
    }),
  );
}

export async function listKeys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let ContinuationToken: string | undefined = undefined;
  do {
    const out: ListObjectsV2CommandOutput = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken,
      }),
    );
    for (const obj of out.Contents || []) {
      if (obj.Key) keys.push(obj.Key);
    }
    ContinuationToken = out.NextContinuationToken;
  } while (ContinuationToken);
  return keys;
}
