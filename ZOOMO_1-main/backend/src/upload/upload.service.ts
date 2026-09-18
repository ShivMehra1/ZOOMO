import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
    constructor() {
        // Reads credentials from Railway environment variables.
        // Set these in Railway → your backend service → Variables:
        //   CLOUDINARY_CLOUD_NAME
        //   CLOUDINARY_API_KEY
        //   CLOUDINARY_API_SECRET
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }

    async uploadImage(
        file: Express.Multer.File,
        folder: 'restaurants' | 'dishes' | 'avatars' | 'payouts',
    ): Promise<string> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('File must be an image');
        }

        // 5MB cap — keep this in sync with the Multer limit in the controller.
        if (file.size > 5 * 1024 * 1024) {
            throw new BadRequestException('Image must be smaller than 5MB');
        }

        const buffer = file.buffer?.length
            ? file.buffer
            : file.path
                ? await fs.readFile(file.path)
                : null;
        if (!buffer?.length) {
            throw new BadRequestException('No file uploaded');
        }

        const cloudReady = Boolean(
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET,
        );

        if (cloudReady) {
            try {
                const result = await new Promise<{ secure_url: string }>(
                    (resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            {
                                folder: `zoomo/${folder}`,
                                resource_type: 'image',
                                transformation: [
                                    { width: 1200, height: 1200, crop: 'limit' },
                                    { quality: 'auto' },
                                    { fetch_format: 'auto' },
                                ],
                            },
                            (error, result) => {
                                if (error || !result) return reject(error);
                                resolve(result as { secure_url: string });
                            },
                        );
                        stream.end(buffer);
                    },
                );
                return result.secure_url;
            } catch (err) {
                console.error('Cloudinary upload failed, falling back to local static:', err);
            }
        }

        try {
            return this.saveLocal(file, folder, buffer);
        } catch (err) {
            console.error('Local image save failed:', err);
            throw new InternalServerErrorException('Image upload failed. Please try again.');
        }
    }

    private async saveLocal(
        file: Express.Multer.File,
        folder: 'restaurants' | 'dishes' | 'avatars' | 'payouts',
        buffer: Buffer,
    ): Promise<string> {
        const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
        const dir = join(process.cwd(), 'public', 'static', folder);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(join(dir, name), buffer);
        return `/static/${folder}/${name}`;
    }
}