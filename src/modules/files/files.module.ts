import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { PrismaService } from '@/src/core/prisma/prisma.service';

@Module({
  providers: [FilesService, PrismaService],
  exports: [FilesService],
})
export class FilesModule {}
