import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { PrismaService } from '@/src/core/prisma/prisma.service';
import { FilesController } from './files.controller';

@Module({
  providers: [FilesService, PrismaService],
  exports: [FilesService],
  controllers: [FilesController],
})
export class FilesModule {}
