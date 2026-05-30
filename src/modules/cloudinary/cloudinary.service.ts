import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
export type UploadResult = UploadApiResponse | UploadApiErrorResponse;

import toStream from 'buffer-to-stream';

@Injectable()
export class CloudinaryService {
  /**
   * Upload file
   */
  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'chat-message-app',
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        },
      );

      toStream(file.buffer).pipe(upload);
    });
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: Express.Multer.File[]): Promise<UploadResult[]> {
    return Promise.all(files.map((file) => this.uploadFile(file)));
  }
}
