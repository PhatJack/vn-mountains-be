import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMountainPhotoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @IsOptional()
  @IsDateString()
  takenAt?: string;
}
