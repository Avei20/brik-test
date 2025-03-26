import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsPositive,
  IsUrl,
} from 'class-validator';

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
  weight: number;

  @IsNumber()
  @IsPositive()
  width: number;

  @IsNumber()
  @IsPositive()
  height: number;

  @IsNumber()
  @IsPositive()
  length: number;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  image: string;

  @IsNumber()
  @IsPositive()
  harga: number;

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;
}
