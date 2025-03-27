import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsPositive,
  IsUrl,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  weight: number;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  width: number;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  height: number;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  length: number;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  harga: number;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  categoryId: number;
}
