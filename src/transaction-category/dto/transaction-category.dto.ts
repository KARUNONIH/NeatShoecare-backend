import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTransactionCategoryDto {
  @ApiProperty({ example: 'operasional' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateTransactionCategoryDto {
  @ApiPropertyOptional({ example: 'gaji' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class TransactionCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
