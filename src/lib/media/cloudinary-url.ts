const CLOUDINARY_UPLOAD_SEGMENT = "/upload/";

export function getOptimizedImageUrl(url: string | null) {
  return addCloudinaryTransform(url, "c_fill,g_auto,w_160,h_160,f_auto,q_auto");
}

export function getOptimizedVideoUrl(
  url: string | null,
  source?: "provided" | "uploaded",
) {
  if (source !== "uploaded") {
    return url;
  }

  return addCloudinaryTransform(url, "f_auto,q_auto");
}

function addCloudinaryTransform(url: string | null, transform: string) {
  if (!url || !url.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return url;
  }

  const [prefix, suffix] = url.split(CLOUDINARY_UPLOAD_SEGMENT);

  if (!prefix || !suffix) {
    return url;
  }

  return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${transform}/${suffix}`;
}
