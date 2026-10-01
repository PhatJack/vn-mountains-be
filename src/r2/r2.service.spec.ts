import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { R2Service } from './r2.service.js';

describe('R2Service', () => {
  const send = vi.fn();
  let service: R2Service;

  beforeEach(() => {
    send.mockReset();
    service = new R2Service({
      get: vi.fn((key: string) =>
        ({ R2_ENDPOINT: '', R2_PUBLIC_URL: 'https://cdn.example/' })[key],
      ),
      getOrThrow: vi.fn((key: string) =>
        ({
          R2_ACCOUNT_ID: 'account',
          R2_ACCESS_KEY_ID: 'access',
          R2_SECRET_ACCESS_KEY: 'secret',
          R2_BUCKET_NAME: 'bucket',
          R2_PUBLIC_URL: 'https://cdn.example/',
        })[key],
      ),
    } as unknown as ConfigService);
    (service as unknown as { client: { send: typeof send } }).client.send = send;
  });

  it('uploads into the mountain UUID prefix', async () => {
    send.mockResolvedValue({});
    const result = await service.uploadBuffer(
      'mountain-id',
      { mimetype: 'image/jpeg', buffer: Buffer.from('image') } as Express.Multer.File,
    );
    const command = send.mock.calls[0][0] as PutObjectCommand;

    expect(command.input).toMatchObject({
      Bucket: 'bucket',
      Key: expect.stringMatching(/^mountains\/mountain-id\/.*\.jpg$/),
      ContentType: 'image/jpeg',
    });
    expect(result.url).toBe(`https://cdn.example/${command.input.Key}`);
  });

  it('deletes an object by public URL', async () => {
    send.mockResolvedValue({});
    await service.deleteByUrl('https://cdn.example/mountains/m1/image.png');
    const command = send.mock.calls[0][0] as DeleteObjectCommand;
    expect(command.input).toEqual({ Bucket: 'bucket', Key: 'mountains/m1/image.png' });
  });

  it('lists and batch-deletes every object in a prefix', async () => {
    send
      .mockResolvedValueOnce({ Contents: [{ Key: 'mountains/m1/a.png' }], IsTruncated: false })
      .mockResolvedValueOnce({});
    await service.deletePrefix('mountains/m1/');
    expect(send.mock.calls[0][0]).toBeInstanceOf(ListObjectsV2Command);
    expect(send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectsCommand);
  });
});
