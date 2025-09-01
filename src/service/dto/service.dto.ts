import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({ example: 'Premium Shoe Cleaning' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '60b8d295f9e1b2c3d4567890' })
  @IsMongoId()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  price: number;

  @ApiPropertyOptional({ example: 'Deep cleaning service for leather shoes' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2-3 hours' })
  @IsString()
  @IsNotEmpty()
  duration: string;
}

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Premium Shoe Cleaning Updated' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '60b8d295f9e1b2c3d4567890' })
  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 60000 })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '3-4 hours' })
  @IsString()
  @IsOptional()
  duration?: string;
}

export class ServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
