import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createReadStream, existsSync } from "node:fs";
import { basename, join } from "node:path";
import type { Response } from "express";
import { Repository } from "typeorm";
import { PartnerVenuePhotoEntity } from "./partner-venue-photo.entity";

@Controller()
export class PartnerUploadsController {
  constructor(
    @InjectRepository(PartnerVenuePhotoEntity)
    private readonly photos: Repository<PartnerVenuePhotoEntity>,
  ) {}

  @Get("uploads/:filename")
  @Header("Cache-Control", "public, max-age=86400, immutable")
  async serveUpload(
    @Param("filename") filenameRaw: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const filename = basename(decodeURIComponent(filenameRaw || "")).trim();
    if (!filename || filename.includes("..")) {
      throw new NotFoundException("file_not_found");
    }

    const mediaDir =
      process.env.PARTNER_MEDIA_DIR?.trim() ||
      join(process.cwd(), "data", "uploads");
    const diskPath = join(mediaDir, filename);
    if (existsSync(diskPath)) {
      const row = await this.photos.findOne({
        where: [
          { filename, status: "active" },
          { storagePath: diskPath, status: "active" },
        ],
        select: ["id", "mimeType"],
      });
      res.setHeader("Content-Type", row?.mimeType || guessMime(filename));
      return new StreamableFile(createReadStream(diskPath));
    }

    const row = await this.photos
      .createQueryBuilder("p")
      .addSelect("p.blobBase64")
      .where("p.status = :status", { status: "active" })
      .andWhere(
        "(p.filename = :filename OR p.storagePath LIKE :pathLike OR p.url LIKE :urlLike OR p.url LIKE :urlEncLike)",
        {
          filename,
          pathLike: `%/${filename}`,
          urlLike: `%/${filename}`,
          urlEncLike: `%/${encodeURIComponent(filename)}`,
        },
      )
      .orderBy("p.updatedAt", "DESC")
      .getOne();

    if (!row?.blobBase64) {
      throw new NotFoundException("file_not_found");
    }

    const buffer = Buffer.from(row.blobBase64, "base64");
    res.setHeader("Content-Type", row.mimeType || guessMime(filename));
    res.setHeader("Content-Length", String(buffer.length));
    return new StreamableFile(buffer);
  }
}

function guessMime(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}
