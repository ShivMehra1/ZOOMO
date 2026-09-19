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
import { memoryStorage } from 'multer';
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
            storage: memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        }),
    )
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Query('folder') folder: 'restaurants' | 'dishes' | 'avatars' | 'payouts' | 'proofs' = 'restaurants',
        @Req() req,
    ) {
        const role = req.user?.role;
        const openFolders = folder === 'avatars' || folder === 'proofs' || folder === 'payouts';
        if (!openFolders && role !== 'MERCHANT' && role !== 'ADMIN') {
            throw new ForbiddenException('Only merchants can upload restaurant/dish images');
        }
        const url = await this.uploadService.uploadImage(file, folder);
        return { url };
    }
}