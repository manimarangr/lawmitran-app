import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    this.bucket = this.config.get<string>('S3_BUCKET') ?? 'lawmitran-documents';
    this.publicBaseUrl = `${endpoint}/${this.bucket}`;
    this.client = new S3Client({
      region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
      endpoint,
      forcePathStyle: this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true',
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY') ?? '',
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY') ?? '',
      },
    });
  }

  async upload(file: Express.Multer.File, keyPrefix: string): Promise<string> {
    const key = `${keyPrefix}/${randomUUID()}-${file.originalname}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return `${this.publicBaseUrl}/${key}`;
  }
}
