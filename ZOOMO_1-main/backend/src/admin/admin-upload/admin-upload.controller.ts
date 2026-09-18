import { Controller, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AdminJwtGuard } from "../guards/admin-jwt/admin-jwt.guard";
import { UploadService } from "../../upload/upload.service";

@Controller("admin/upload")
@UseGuards(AdminJwtGuard)
export class AdminUploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("image")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query("folder") folder: "restaurants" | "dishes" | "avatars" | "payouts" = "restaurants",
  ) {
    const url = await this.uploadService.uploadImage(file, folder);
    return { url };
  }
}
