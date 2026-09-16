import {
    Controller,
    ForbiddenException,
    Post,
    Query,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    // POST /upload/image?folder=restaurants   (or ?folder=dishes, ?folder=avatars)
    // Avatars are uploadable by any authenticated role (customer, driver, merchant);
    // restaurant/dish photos stay merchant-only, enforced below since @Roles was
    // previously applied at the controller level and blocked drivers/customers entirely.
    @Post('image')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        }),
    )
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Query('folder') folder: 'restaurants' | 'dishes' | 'avatars' = 'restaurants',
        @Req() req,
    ) {
        if (folder !== 'avatars' && req.user?.role !== 'MERCHANT') {
            throw new ForbiddenException('Only merchants can upload restaurant/dish images');
        }
        const url = await this.uploadService.uploadImage(file, folder);
        return { url };
    }
}