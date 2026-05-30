import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { ValidationCustomPipe } from './validation.pipe';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationCustomPipe,
    },
  ],
})
export class PipeModule {}
