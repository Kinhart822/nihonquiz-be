import {
  QUESTION_BANK_JOB,
  QUESTION_BANK_QUEUE,
} from '@constants/queue.constant';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SocketEmitterService } from '../../modules/socket/socket-emitter.service';
import { QuestionService } from '../../modules/question-bank/question.service';
import { Readable } from 'stream';

@Processor(QUESTION_BANK_QUEUE)
export class QuestionBankProcessor extends WorkerHost {
  private readonly logger = new Logger(QuestionBankProcessor.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly socketEmitterService: SocketEmitterService,
    private readonly questionService: QuestionService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case QUESTION_BANK_JOB.IMPORT_QUESTIONS:
        return this.handleImportQuestions(job);
      case QUESTION_BANK_JOB.EXPORT_QUESTIONS:
        return this.handleExportQuestions(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleImportQuestions(job: Job<any>) {
    const { file, practiceTestId, miniQuizId, email } = job.data;

    // File buffer comes from Redis job data
    const buffer = Buffer.from(file.buffer.data);

    try {
      this.logger.log(`Starting import questions for ${email}`);
      const result = await this.questionService.importQuestions(
        buffer,
        practiceTestId,
        miniQuizId,
      );

      this.socketEmitterService.emitQuestionImportCompleted(email, {
        success: true,
        importedCount: result.importedCount,
      });

      this.logger.log(
        `Imported ${result.importedCount} questions for ${email}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to import questions for ${email}`, error.stack);

      this.socketEmitterService.emitQuestionImportCompleted(email, {
        success: false,
        error: error.message || 'Import failed',
      });
    }
  }

  private async handleExportQuestions(job: Job<any>) {
    const { practiceTestId, miniQuizId, email } = job.data;

    try {
      this.logger.log(`Starting export questions for ${email}`);
      const buffer = await this.questionService.exportQuestions(
        practiceTestId,
        miniQuizId,
      );

      // Upload buffer to Cloudinary as raw file
      const multerFile: Express.Multer.File = {
        buffer,
        originalname: `export_${Date.now()}.xlsx`,
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fieldname: 'file',
        encoding: '7bit',
        size: buffer.length,
        stream: new Readable(),
        destination: '',
        filename: '',
        path: '',
      };

      const uploadResult: any =
        await this.cloudinaryService.uploadFile(multerFile);

      this.socketEmitterService.emitQuestionExportCompleted(email, {
        success: true,
        url: uploadResult.secure_url,
      });

      this.logger.log(`Exported questions for ${email}`);
    } catch (error: any) {
      this.logger.error(`Failed to export questions for ${email}`, error.stack);

      this.socketEmitterService.emitQuestionExportCompleted(email, {
        success: false,
        error: error.message || 'Export failed',
      });
    }
  }
}
