import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindAllDTO {
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page: number = 1;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}
