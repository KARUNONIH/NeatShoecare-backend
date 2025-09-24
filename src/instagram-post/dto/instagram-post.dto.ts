import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsMongoId,
  IsDateString,
} from 'class-validator';

export class CreateInstagramPostDto {
  @ApiProperty({ description: 'ID order terkait' })
  @IsMongoId()
  orderId: string;

  @ApiProperty({ description: 'URL foto setelah treatment' })
  @IsString()
  photoAfterUrl: string;

  @ApiProperty({ description: 'Caption postingan Instagram' })
  @IsString()
  caption: string;
}

export class UpdateInstagramPostDto extends PartialType(
  CreateInstagramPostDto,
) {
  @ApiProperty({ description: 'Status publish', required: false })
  @IsOptional()
  @IsBoolean()
  isPublish?: boolean;

  @ApiProperty({ description: 'Waktu posting', required: false })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiProperty({ description: 'Waktu takedown', required: false })
  @IsOptional()
  @IsDateString()
  takedownAt?: string;
}

export class TakedownInstagramPostDto {
  @ApiProperty({ description: 'Alasan takedown', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class InstagramPostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  photoAfterUrl: string;

  @ApiProperty()
  caption: string;

  @ApiProperty({ required: false })
  publishedAt?: Date;

  @ApiProperty({ required: false })
  takedownAt?: Date;

  @ApiProperty()
  isPublish: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
