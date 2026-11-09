import * as Minio from "minio";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "localhost";
const MINIO_PORT = parseInt(process.env.MINIO_PORT || "9000", 10);
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === "true";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minioadmin";

export const MINIO_BUCKET = process.env.MINIO_BUCKET || "maskandmaker-media";

export const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

let isMinioHealthy = false;

/**
 * Initializes MinIO Bucket & sets public read policy for CDN / <model-viewer>
 */
export async function initMinio(): Promise<boolean> {
  try {
    console.log(`🪣 Initializing MinIO connection at ${MINIO_ENDPOINT}:${MINIO_PORT}...`);

    const exists = await minioClient.bucketExists(MINIO_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(MINIO_BUCKET, "us-east-1");
      console.log(`✅ Created MinIO bucket '${MINIO_BUCKET}'.`);

      // Set public read policy for images and 3D glb models
      const readOnlyPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicRead",
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(MINIO_BUCKET, JSON.stringify(readOnlyPolicy));
      console.log(`🌐 Configured public-read bucket policy for '${MINIO_BUCKET}'.`);
    } else {
      console.log(`✅ MinIO bucket '${MINIO_BUCKET}' verified.`);
    }

    isMinioHealthy = true;
    return true;
  } catch (error: any) {
    console.error("❌ Failed to connect to MinIO:", error.message);
    isMinioHealthy = false;
    return false;
  }
}

export function isMinioConnected(): boolean {
  return isMinioHealthy;
}
