import { errorResponse, readJsonObject } from "@/lib/api/http";
import {
  getCloudinaryConfig,
  signCloudinaryUpload,
  type CloudinaryResourceType,
} from "@/lib/media/cloudinary-server";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

type UploadFolder = "profiles" | "sessions";

const VALID_FOLDERS = new Set<UploadFolder>(["profiles", "sessions"]);
const VALID_RESOURCE_TYPES = new Set<CloudinaryResourceType>([
  "image",
  "video",
]);

/**
 * POST /api/cloudinary/sign-upload
 * - Verifies the bearer token with Supabase Auth.
 * - Validates the requested Cloudinary folder and resource type.
 * - Signs upload parameters with the server-only Cloudinary secret.
 * - Returns the signed direct-upload payload for the browser.
 */
export async function POST(request: Request) {
  const token = readBearerToken(request);

  if (!token) {
    return errorResponse("Missing bearer token.", 401);
  }

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } =
    await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    return errorResponse("Invalid or expired session.", 401);
  }

  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse("Request body must be a JSON object.");
  }

  const folder = typeof body.folder === "string" ? body.folder : "";
  const resourceType =
    typeof body.resourceType === "string" ? body.resourceType : "";

  if (!VALID_FOLDERS.has(folder as UploadFolder)) {
    return errorResponse("Upload folder is not supported.");
  }

  if (!VALID_RESOURCE_TYPES.has(resourceType as CloudinaryResourceType)) {
    return errorResponse("Resource type must be image or video.");
  }

  try {
    const cloudinary = getCloudinaryConfig();
    const timestamp = Math.round(Date.now() / 1000);
    const signature = signCloudinaryUpload(
      {
        folder,
        timestamp,
      },
      cloudinary.apiSecret,
    );

    return Response.json({
      apiKey: cloudinary.apiKey,
      cloudName: cloudinary.cloudName,
      folder,
      resourceType,
      signature,
      timestamp,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${resourceType}/upload`,
    });
  } catch {
    return errorResponse("Cloudinary is not configured.", 500);
  }
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}
