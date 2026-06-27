import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { v2 } from 'cloudinary';
import { MessageAttachmentType } from '../../constants/user.constant';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

jest.mock('buffer-to-stream', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
  }));
});

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should resolve with result on successful upload', async () => {
      /*
       * Flow: Upload File (Success)
       * 1. Mock cloudinary upload_stream to return success result.
       * 2. Call service.uploadFile with mock file buffer.
       * 3. Verify upload_stream is called and result is returned.
       */
      const mockResult = { public_id: '123' };
      (v2.uploader.upload_stream as jest.Mock).mockImplementation(
        (opts, cb) => {
          cb(null, mockResult);
        },
      );

      const file = { buffer: Buffer.from('test') } as any;
      const result = await service.uploadFile(file);

      expect(result).toEqual(mockResult);
      expect(v2.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'chat-message-app' }),
        expect.any(Function),
      );
    });

    it('should reject with error on failed upload', async () => {
      /*
       * Flow: Upload File (Failure)
       * 1. Mock cloudinary upload_stream to throw error.
       * 2. Call service.uploadFile with mock file buffer.
       * 3. Verify it rejects with the error.
       */
      const mockError = new Error('upload failed');
      (v2.uploader.upload_stream as jest.Mock).mockImplementation(
        (opts, cb) => {
          cb(mockError, null);
        },
      );

      const file = { buffer: Buffer.from('test') } as any;
      await expect(service.uploadFile(file)).rejects.toThrow('upload failed');
    });
  });

  describe('uploadFiles', () => {
    it('should upload multiple files', async () => {
      /*
       * Flow: Upload Multiple Files
       * 1. Mock service.uploadFile to return success.
       * 2. Call service.uploadFiles with array of files.
       * 3. Verify uploadFile is called for each file.
       */
      jest
        .spyOn(service, 'uploadFile')
        .mockResolvedValue({ public_id: '123' } as any);

      const files = [
        { buffer: Buffer.from('1') },
        { buffer: Buffer.from('2') },
      ] as any[];
      const results = await service.uploadFiles(files);

      expect(results).toHaveLength(2);
      expect(service.uploadFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMediaTypeFromResult', () => {
    it('should return FILE if error', () => {
      /*
       * Flow: Get Media Type (Error)
       * 1. Pass result with error property.
       * 2. Verify it returns FILE type.
       */
      const result = service.getMediaTypeFromResult({ error: {} } as any);
      expect(result).toBe(MessageAttachmentType.FILE);
    });

    it('should return IMAGE if resource_type is image', () => {
      /*
       * Flow: Get Media Type (Image)
       * 1. Pass result with resource_type='image'.
       * 2. Verify it returns IMAGE type.
       */
      const result = service.getMediaTypeFromResult({
        resource_type: 'image',
      } as any);
      expect(result).toBe(MessageAttachmentType.IMAGE);
    });

    it('should return AUDIO if resource_type is video and format is audio', () => {
      /*
       * Flow: Get Media Type (Audio)
       * 1. Pass result with resource_type='video' and format='mp3'.
       * 2. Verify it returns AUDIO type.
       */
      const result = service.getMediaTypeFromResult({
        resource_type: 'video',
        format: 'mp3',
      } as any);
      expect(result).toBe(MessageAttachmentType.AUDIO);
    });

    it('should return VIDEO if resource_type is video and format is video', () => {
      /*
       * Flow: Get Media Type (Video)
       * 1. Pass result with resource_type='video' and format='mp4'.
       * 2. Verify it returns VIDEO type.
       */
      const result = service.getMediaTypeFromResult({
        resource_type: 'video',
        format: 'mp4',
      } as any);
      expect(result).toBe(MessageAttachmentType.VIDEO);
    });

    it('should return FILE otherwise', () => {
      /*
       * Flow: Get Media Type (Default/File)
       * 1. Pass result with generic resource_type (e.g., 'raw').
       * 2. Verify it returns FILE type.
       */
      const result = service.getMediaTypeFromResult({
        resource_type: 'raw',
      } as any);
      expect(result).toBe(MessageAttachmentType.FILE);
    });
  });
});
