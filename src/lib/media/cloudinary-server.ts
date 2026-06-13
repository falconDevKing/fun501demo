import { createHash } from "node:crypto";

type CloudinarySignParams = {
  folder: string;
  timestamp: number;
};

export type CloudinaryResourceType = "image" | "video";

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables.");
  }

  return {
    apiKey,
    apiSecret,
    cloudName,
  };
}

export function signCloudinaryUpload(
  params: CloudinarySignParams,
  apiSecret: string,
) {
  const source = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${source}${apiSecret}`).digest("hex");
}
