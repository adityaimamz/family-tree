import { createUploadthing, type FileRouter } from "uploadthing/express";
import { UTApi, UTFile } from "uploadthing/server";
import sharp from "sharp";

const f = createUploadthing();

export const uploadContentTypes = ["image/jpeg", "image/png", "image/webp"] as const;

type UploadFolder = "members" | "gallery";

type CompatibleUploadResult = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
};

type UploadThingFile = {
  key: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  ufsUrl?: string;
};

const maxImageDimension = 1600;
const webpQuality = 82;

const ensureUploadThingToken = () => {
  if (!process.env.UPLOADTHING_TOKEN) {
    throw new Error("UPLOADTHING_TOKEN is not configured.");
  }
};

const getUtapi = () => {
  ensureUploadThingToken();
  return new UTApi({ token: process.env.UPLOADTHING_TOKEN });
};

const toWebP = async (input: Buffer) =>
  sharp(input)
    .rotate()
    .resize({
      width: maxImageDimension,
      height: maxImageDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: webpQuality })
    .toBuffer();

const baseFilename = (value: string) => value.replace(/\.[^.]+$/, "") || "photo";

const uploadWebPBuffer = async (webp: Buffer, filename: string): Promise<CompatibleUploadResult> => {
  const upload = await getUtapi().uploadFiles(
    new UTFile([new Uint8Array(webp)], filename, {
      type: "image/webp",
    }),
    { contentDisposition: "inline" },
  );

  if (!upload.data) {
    throw new Error(upload.error?.message || "UploadThing upload failed.");
  }

  return {
    url: upload.data.ufsUrl,
    pathname: upload.data.key,
    contentType: upload.data.type,
    size: upload.data.size,
  };
};

export const uploadOptimizedImage = async ({
  body,
  filename,
  folder,
}: {
  body: Buffer;
  filename: string;
  folder: UploadFolder;
}) => {
  const webp = await toWebP(body);
  const uploadFilename = `${folder}-${Date.now()}-${baseFilename(filename)}.webp`;
  return uploadWebPBuffer(webp, uploadFilename);
};

const optimizeUploadedFile = async (file: UploadThingFile) => {
  const originalUrl = file.ufsUrl ?? file.url;
  if (!originalUrl) {
    throw new Error("UploadThing did not return a file URL.");
  }

  if (file.type === "image/webp") {
    return {
      url: originalUrl,
      pathname: file.key,
      contentType: file.type,
      size: file.size,
      wasConverted: false,
    };
  }

  try {
    const response = await fetch(originalUrl);
    if (!response.ok) {
      throw new Error(`Failed to download uploaded image: ${response.status}`);
    }

    const input = Buffer.from(await response.arrayBuffer());
    const webp = await toWebP(input);
    const optimized = await uploadWebPBuffer(webp, `${baseFilename(file.name)}.webp`);

    await getUtapi().deleteFiles(file.key).catch((error) => {
      console.error("Failed to delete original UploadThing file after optimization.", error);
    });

    return {
      ...optimized,
      wasConverted: true,
    };
  } catch (error) {
    console.error("Failed to optimize UploadThing upload. Falling back to original file.", error);
    return {
      url: originalUrl,
      pathname: file.key,
      contentType: file.type,
      size: file.size,
      wasConverted: false,
    };
  }
};

export const uploadRouter = {
  imageUploader: f({
    "image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "4MB", maxFileCount: 1 },
    "image/webp": { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      if (!req.user) {
        throw new Error("Authentication required.");
      }

      return { userId: req.user.id, role: req.user.role };
    })
    .onUploadComplete(async ({ file }) => optimizeUploadedFile(file)),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
