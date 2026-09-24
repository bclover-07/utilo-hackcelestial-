import { v2 as cloudinary } from "cloudinary";
import { fileTypeFromBuffer } from "file-type";
import { Upload } from "../models/index.js";
import { assert, ApiError } from "../middlewares/errors.js";
function configure() {
  assert(
    process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_CLOUD_NAME,
    503,
    "Image storage is not configured.",
  );
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}
export async function upload(user, file, kind) {
  assert(file, 400, "Choose a file to upload.");
  assert(["image", "document"].includes(kind), 400, "Invalid upload type.");
  const type = await fileTypeFromBuffer(file.buffer);
  assert(
    type &&
      (kind === "document"
        ? ["image/jpeg", "image/png", "application/pdf"]
        : ["image/jpeg", "image/png", "image/webp"]
      ).includes(type.mime),
    400,
    "Use JPEG, PNG or WebP photos; verification documents may also be PDF.",
  );
  configure();
  let result;
  try {
    result = await new Promise((resolve, reject) =>
      cloudinary.uploader
        .upload_stream(
          {
            folder: `utlio/${user._id}/${kind}`,
            resource_type: type.mime === "application/pdf" ? "raw" : "image",
            type: kind === "document" ? "authenticated" : "upload",
          },
          (err, result) => (err ? reject(err) : resolve(result)),
        )
        .end(file.buffer),
    );
  } catch {
    throw new ApiError(502, "Cloudinary could not store the file. Try again.");
  }
  return Upload.create({
    owner: user._id,
    publicId: result.public_id,
    url: kind === "image" ? result.secure_url : undefined,
    resourceType: result.resource_type,
    kind,
  });
}
export async function documentUrl(user, id) {
  configure();
  const doc = await Upload.findById(id);
  assert(
    doc &&
      doc.kind === "document" &&
      (user.role === "admin" || String(doc.owner) === String(user._id)),
    404,
    "Document not found.",
  );
  return {
    url: cloudinary.utils.private_download_url(doc.publicId, "", {
      resource_type: doc.resourceType,
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 120,
    }),
  };
}
