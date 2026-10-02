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

  @IsString()
  @MaxLength(250)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  nameVi?: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsNumber()
  elevationM?: number;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  description?: string;

}
