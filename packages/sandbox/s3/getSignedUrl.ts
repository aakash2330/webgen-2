import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./client";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function getPreSignedUrl({
  bucketName,
  path,
}: {
  bucketName: string;
  path: string;
}) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: path,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 500 });
  return url;
}
