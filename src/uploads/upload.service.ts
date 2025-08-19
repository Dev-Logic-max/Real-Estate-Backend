import { BadRequestException, Injectable } from '@nestjs/common';
import { Multer } from 'multer';

@Injectable()
export class UploadService {
  async uploadFile(file: Express.Multer.File, type: string): Promise<string> {
    if (!file) throw new BadRequestException('No file uploaded');
    const uniqueNumber = file.filename.split('.')[0]; // Extract unique number from filename
    const ext = file.filename.split('.').pop() || ''; // e.g., 'jpg'
    return `/${type}/${uniqueNumber}.${ext}`; // e.g., "/profile/a1b2c3d4.jpg"
  }
}