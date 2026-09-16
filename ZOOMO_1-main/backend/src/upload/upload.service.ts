import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
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
        folder: 'restaurants' | 'dishes' | 'avatars',
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

        try {
            const result = await new Promise<{ secure_url: string }>(
                (resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: `zoomo/${folder}`,
                            resource_type: 'image',
                            // Keeps images reasonably sized & fast-loading on the customer app
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
                    stream.end(file.buffer);
                },
            );

            return result.secure_url;
        } catch (err) {
            console.error('Cloudinary upload failed:', err);
            throw new InternalServerErrorException(
                'Image upload failed. Please try again.',
            );
        }
    }
}