import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private bucketReady = false;

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

  /** MinIO starts empty — create the bucket on first use so dev "just works". */
  private async ensureBucket(): Promise<void> {
    if (this.bucketReady) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.bucketReady = true;
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created storage bucket "${this.bucket}"`);
        this.bucketReady = true;
      } catch (err) {
        this.logger.error(`Storage unavailable: ${(err as Error).message}`);
        throw new ServiceUnavailableException(
          'Document storage is unavailable — check that MinIO is running and S3_* env vars are correct',
        );
      }
    }
  }

  async upload(file: Express.Multer.File, keyPrefix: string): Promise<string> {
    await this.ensureBucket();
    const key = `${keyPrefix}/${randomUUID()}-${file.originalname}`;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (err) {
      this.logger.error(`Upload failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException(
        'Could not store the uploaded document — please try again',
      );
    }
    return `${this.publicBaseUrl}/${key}`;
  }
}
