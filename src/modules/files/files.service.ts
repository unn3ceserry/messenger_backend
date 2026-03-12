import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

@Injectable()
export class FilesService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });

    this.bucket = process.env.S3_BUCKET!;
  }

  public async upload(file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException('Файл не найден');
    }
    console.log('file', file);
    const ext = file.originalname.split('.').pop();
    const fileName = `${randomBytes(16).toString('hex')}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: `files/${fileName}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await this.client.send(command);

    const url = new URL(
      `files/${fileName}`,
      `${process.env.S3_ENDPOINT}/${this.bucket}/`,
    ).toString();

    return { url, fileName };
  }

  public async delete(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return this.client.send(command);
  }
}
