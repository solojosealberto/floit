import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { NextResponse } from "next/server";

const IMAGE_MAP: Record<string, string> = {
  "oxide-1":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/images__4_-9b03f468-acc9-4afe-87df-98187213d58d.png",
  "oxide-2":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/industrial-fitness-space-stockcake-f47c1db5-f2df-4643-9e03-3e794b672065.png",
  "arena-1":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/images__2_-69491a4b-da5d-4b80-9b76-4d6c69dff3cb.png",
  "arena-2":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/images__1_-173ec1e0-f8e2-40e1-9b38-6f274b5c687b.png",
  "zen-1":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/reimagining-gym-spaces-the-rise-of-design-driven-fitness-experiences_3-02be7587-77d5-4430-9634-35d318479d18.png",
  "zen-2":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/Noveme_02_PP-min-6988e5ce-36e2-44fe-8052-cb98ab2ccd41.png",
  "metropolitan-1":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/images-75d4c56a-7829-4366-8ffe-af7fd22e8ae2.png",
  "metropolitan-2":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/Functionality-and-Space-Planning-03.04.2024-26edfc5a-941f-49e4-a3af-8feb9ce8b1c5.png",
  "las-mercedes-1":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/images__3_-6cc964ae-d913-441b-b02c-ae0e2f0209d9.png",
  "las-mercedes-2":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/20b2a419-03c1-4fe3-b5ca-14b87fc21892-1d93b579-f814-49ee-bd9c-5e1ef628ed0c.png",
  "ride-1":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/UysKdKU3wp97ojX4GmTUGC-09d1b41e-7035-467b-bc70-f3d8367efbb0.png",
  "ride-2":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/business-gym-min_1bd6067e-e512-4b0e-9e2c-19c760013bdc-9f84443a-590a-43a1-b277-c598137f5082.png",
  "forma-1":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/fullsizeoutput_f273-b2e5c0fd-0f17-4404-a146-8752af1f774b.png",
  "forma-2":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/kgu1tizjtae5fhb4y4sv-8d8617c3-3afb-49aa-8303-812e000a0c5d.png",
  "balance-1":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/gb-botanica-gym-link-spaces-slough-c6f5d2c5-6d83-4234-a44c-7ebc3785622a.png",
  "balance-2":
    "/Users/nosoyelmago/.cursor/projects/Users-nosoyelmago-Documents-FLOIT-v-0-2/assets/Noveme_02_PP-min-6988e5ce-36e2-44fe-8052-cb98ab2ccd41.png",
};

function contentTypeFor(path: string): string {
  const ext = extname(path).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/png";
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await context.params;
  const filePath = IMAGE_MAP[imageId];
  if (!filePath) {
    return NextResponse.json({ message: "Image not found" }, { status: 404 });
  }
  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "content-type": contentTypeFor(filePath),
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ message: "Image not available" }, { status: 404 });
  }
}

