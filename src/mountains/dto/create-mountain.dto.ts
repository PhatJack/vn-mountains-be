import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateMountainDto {
  @IsOptional()
  @IsInt()
  osmId?: number;

  @IsString()
  @MaxLength(250)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  nameAscii?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  altName?: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsNumber()
  elevation?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}