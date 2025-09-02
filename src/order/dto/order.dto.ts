import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsMongoId,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../order.schema';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID order utama untuk mengelompokkan beberapa service',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  orderGroupId?: string;

  @ApiProperty({ description: 'Unique code for order group' })
  @IsString()
  uniqueCode: string;

  @ApiProperty({ description: 'ID layanan' })
  @IsMongoId()
  serviceId: string;

  @ApiProperty({ enum: OrderStatus, default: OrderStatus.REQUESTED })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ description: 'Apakah ada antar-jemput', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  pickupDelivery?: boolean;

  @ApiProperty({ description: 'Catatan untuk pickup', required: false })
  @IsOptional()
  @IsString()
  pickupNote?: string;

  @ApiProperty({ description: 'Tanggal mulai', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Tanggal selesai', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Total Harga' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Catatan tambahan', required: false })
  @IsOptional()
  @IsString()
  serviceNote?: string;
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}

export class UploadPhotoDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Photo before file',
    required: false,
  })
  photoBefore?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Photo after file',
    required: false,
  })
  photoAfter?: Express.Multer.File;
}

export class UpdatePhotoDto extends UploadPhotoDto {}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  orderGroupId?: string;

  @ApiProperty()
  uniqueCode: string;

  @ApiProperty()
  serviceId: string;

  @ApiProperty()
  serviceName: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod, required: false })
  paymentMethod?: PaymentMethod;

  @ApiProperty()
  pickupDelivery: boolean;

  @ApiProperty({ required: false })
  pickupNote?: string;

  @ApiProperty({ required: false })
  startDate?: Date;

  @ApiProperty({ required: false })
  endDate?: Date;

  @ApiProperty()
  amount: number;

  @ApiProperty({ required: false })
  photoBefore?: string;

  @ApiProperty({ required: false })
  photoBeforeId?: string;

  @ApiProperty({ required: false })
  photoAfter?: string;

  @ApiProperty({ required: false })
  photoAfterId?: string;

  @ApiProperty({ required: false })
  serviceNote?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
