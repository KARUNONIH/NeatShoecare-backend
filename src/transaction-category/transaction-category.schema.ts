import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionCategoryDocument = TransactionCategory & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class TransactionCategory {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TransactionCategorySchema =
  SchemaFactory.createForClass(TransactionCategory);

TransactionCategorySchema.index({ deletedAt: 1 });
