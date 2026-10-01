import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface UploadedObject {
  key: string;
  url: string;
}

@Injectable()
export class R2Service {
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>('R2_ACCOUNT_ID');

    this.client = new S3Client({
      region: 'auto',
      endpoint:
        this.configService.get<string>('R2_ENDPOINT') ||
        `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'R2_SECRET_ACCESS_KEY',
        ),
      },
    });

    this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME');

    this.publicUrl = this.configService
      .getOrThrow<string>('R2_PUBLIC_URL')
      .replace(/\/$/, '');
  }

  async uploadBuffer(
    mountainId: string,
    file: Express.Multer.File,
  ): Promise<UploadedObject> {
    const extensionByMimeType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const extension = extensionByMimeType[file.mimetype];
    const key = `mountains/${mountainId}/${randomUUID()}.${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return { key, url: `${this.publicUrl}/${key}` };
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  async deleteByUrl(url: string): Promise<void> {
    await this.deleteObject(this.keyFromUrl(url));
  }

  async deletePrefix(prefix: string): Promise<void> {
    let continuationToken: string | undefined;

    do {
      const result = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      const objects = (result.Contents ?? [])
        .filter((object): object is { Key: string } => Boolean(object.Key))
        .map((object) => ({ Key: object.Key }));

      if (objects.length) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: { Objects: objects, Quiet: true },
          }),
        );
      }

      continuationToken = result.IsTruncated
        ? result.NextContinuationToken
        : undefined;
    } while (continuationToken);
  }

  private keyFromUrl(url: string): string {
    const publicUrl = this.publicUrl.replace(/\/$/, '');
    if (!url.startsWith(`${publicUrl}/`)) {
      throw new Error('Image URL does not belong to the configured R2 public URL');
    }
    return url.slice(publicUrl.length + 1);
  }
}
