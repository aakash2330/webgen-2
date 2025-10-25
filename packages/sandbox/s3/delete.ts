import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { s3 } from "./client";

const bucket = "webgen-react";

export async function deleteFolder(prefix: string) {
  const list = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
  );

  if (list.Contents && list.Contents.length > 0) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: list.Contents.map((obj) => ({ Key: obj.Key })),
        },
      }),
    );
  }

  console.log("Folder deleted successfully.");
}
