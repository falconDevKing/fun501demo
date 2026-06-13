import type { CloudinaryResourceType } from "./cloudinary-server";

type SignUploadResponse = {
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: CloudinaryResourceType;
  signature: string;
  timestamp: number;
  uploadUrl: string;
};

export type CloudinaryUploadResult = {
  publicId: string;
  resourceType: CloudinaryResourceType;
  secureUrl: string;
};

export async function uploadToCloudinary({
  file,
  folder,
  resourceType,
  token,
}: {
  file: File;
  folder: "profiles" | "sessions";
  resourceType: CloudinaryResourceType;
  token: string;
}) {
  const signResponse = await fetch("/api/cloudinary/sign-upload", {
    body: JSON.stringify({ folder, resourceType }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const signData = (await signResponse.json()) as
    | SignUploadResponse
    | {
        error: string;
      };

  if (!signResponse.ok || "error" in signData) {
    throw new Error("error" in signData ? signData.error : "Upload failed.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signData.apiKey);
  formData.append("folder", signData.folder);
  formData.append("signature", signData.signature);
  formData.append("timestamp", String(signData.timestamp));

  const uploadResponse = await fetch(signData.uploadUrl, {
    body: formData,
    method: "POST",
  });
  const uploadData = (await uploadResponse.json()) as {
    public_id?: string;
    resource_type?: CloudinaryResourceType;
    secure_url?: string;
  };

  if (!uploadResponse.ok || !uploadData.public_id || !uploadData.secure_url) {
    throw new Error("Cloudinary upload failed.");
  }

  return {
    publicId: uploadData.public_id,
    resourceType: uploadData.resource_type ?? signData.resourceType,
    secureUrl: uploadData.secure_url,
  } satisfies CloudinaryUploadResult;
}
