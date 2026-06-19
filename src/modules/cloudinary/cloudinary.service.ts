import { MessageAttachmentType } from '@constants/user.constant';
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
          if (error) return reject(error);
          resolve(result!);
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

  /**
   * Determine MessageAttachmentType from Cloudinary upload result
   */
  getMediaTypeFromResult(result: UploadResult): MessageAttachmentType {
    // If it's an error response, default to FILE
    if ('error' in result) {
      return MessageAttachmentType.FILE;
    }

    const { resource_type, format } = result;

    if (resource_type === 'image') {
      return MessageAttachmentType.IMAGE;
    }

    if (resource_type === 'video') {
      // Check if it's audio based on format
      const audioFormats = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];
      if (audioFormats.includes(format?.toLowerCase())) {
        return MessageAttachmentType.AUDIO;
      }
      return MessageAttachmentType.VIDEO;
    }

    return MessageAttachmentType.FILE;
  }
}
