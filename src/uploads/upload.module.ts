import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import * as uuid from 'uuid';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        storage: diskStorage({
          destination: (req, file, cb) => {
            let type = 'general';
            if (req.route.path.includes('profile-image-upload')) type = 'profile';
            else if (req.route.path.includes('upload-property-images')) type = 'property'; // For future property endpoint
            const dir = `./uploads/${type}`;
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
          },
          filename: (req, file, cb) => {
            const uniqueNumber = uuid.v4().split('-')[0]; // 8-char hex, e.g., 'a1b2c3d4'
            const ext = extname(file.originalname).toLowerCase();
            cb(null, `${uniqueNumber}${ext}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          const allowedImageTypes = /jpeg|jpg|png/;
          const allowedVideoTypes = /mp4|avi|mov/;
          const ext = extname(file.originalname).toLowerCase();
          let type = 'general';
            if (req.route.path.includes('profile-image-upload')) type = 'profile';
          if (type === 'video' && allowedVideoTypes.test(ext)) {
            cb(null, true);
          } else if (allowedImageTypes.test(ext)) {
            cb(null, true);
          } else {
            cb(new Error('Only images (jpeg, jpg, png) or videos (mp4, avi, mov) are allowed'), false);
          }
        },
        limits: { fileSize: configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024) }, // 10MB limit
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UploadService],
  exports: [UploadService, MulterModule],
})
export class UploadModule { }