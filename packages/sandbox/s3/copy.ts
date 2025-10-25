import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import { s3 } from "./client";

export async function copyFolder(
  bucket: string,
  sourcePrefix: string,
  destPrefix: string,
) {
  let ContinuationToken;
  do {
    const list: ListObjectsV2CommandOutput = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: sourcePrefix,
        ContinuationToken,
      }),
    );

    for (const obj of list.Contents || []) {
      if (!obj.Key) return;
      const newKey = obj.Key.replace(sourcePrefix, destPrefix);
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${obj.Key}`,
          Key: newKey,
        }),
      );
      console.log(`Copied: ${obj.Key} → ${newKey}`);
    }

    ContinuationToken = list.NextContinuationToken;
  } while (ContinuationToken);
}

