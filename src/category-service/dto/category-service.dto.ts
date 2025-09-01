import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryServiceDto {
  @ApiProperty({ example: 'Cleaning Service' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateCategoryServiceDto {
  @ApiPropertyOptional({ example: 'Deep Cleaning Service' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class CategoryServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
