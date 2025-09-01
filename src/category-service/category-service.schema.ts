import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryServiceDocument = CategoryService & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class CategoryService {
  @Prop({ required: true })
  name: string;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CategoryServiceSchema =
  SchemaFactory.createForClass(CategoryService);

// Add index for soft delete queries
CategoryServiceSchema.index({ deletedAt: 1 });
