import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';
import { initSwagger } from './swagger';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors();
  app.setGlobalPrefix(configService.get<string>('GLOBAL_PREFIX') || 'api');

  // Swagger
  if (configService.get<string>('SWAGGER_PATH')) {
    initSwagger(app, configService.get<string>('SWAGGER_PATH'));
  }

  const appPort = configService.get<number>('PORT') || 3000;

  await app.listen(appPort, () => {
    // console.clear();
    console.log('\n');
    console.log(
      '  ███╗   ███╗ ██████╗ ██████╗ ██╗██████╗ ██████╗  █████╗  ██████╗████████╗',
    );
    console.log(
      '  ████╗ ████║██╔═══██╗██╔══██╗██║██╔══██╗██╔══██╗██╔══██╗██╔════╝╚══██╔══╝',
    );
    console.log(
      '  ██╔████╔██║██║   ██║██████╔╝██║██████╔╝██████╔╝███████║██║        ██║   ',
    );
    console.log(
      '  ██║╚██╔╝██║██║   ██║██╔══██╗██║██╔═══╝ ██╔══██╗██╔══██║██║        ██║   ',
    );
    console.log(
      '  ██║ ╚═╝ ██║╚██████╔╝██║  ██║██║██║     ██║  ██║██║  ██║╚██████╗   ██║   ',
    );
    console.log(
      '  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝   ╚═╝   ',
    );
    console.log('\n');
    console.log(`   > Local:            http://localhost:${appPort}/api/docs`);
    console.log(`   Press CTRL+C to stop the server\n`);
  });
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
