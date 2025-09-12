import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TransactionType } from '../transaction.schema';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, example: TransactionType.Pemasukan })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: '2025-09-12' })
  @IsDateString()
  date: string; // ISO string

  @ApiPropertyOptional({ example: 'Pembayaran order #123' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  amount: number;

  @ApiProperty({ example: '60b8d295f9e1b2c3d4567890' })
  @IsMongoId()
  @IsNotEmpty()
  categoryId: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({ example: '2025-09-12' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: 'Catatan diubah' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 200000 })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: '60b8d295f9e1b2c3d4567890' })
  @IsMongoId()
  @IsOptional()
  categoryId?: string;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
