import { validate } from 'class-validator';
import { CreateMountainPhotoDto } from './create-mountain-photo.dto.js';

describe('CreateMountainPhotoDto', () => {
  it('accepts a caption and ISO timestamp', async () => {
    const dto = Object.assign(new CreateMountainPhotoDto(), {
      caption: '  Summit view  ',
      takenAt: '2026-10-02T00:00:00.000Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an invalid timestamp', async () => {
    const dto = Object.assign(new CreateMountainPhotoDto(), {
      takenAt: 'not-a-date',
    });

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'takenAt' })]),
    );
  });
});
