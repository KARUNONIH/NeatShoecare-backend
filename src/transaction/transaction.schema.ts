import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  Pemasukan = 'pemasukan',
  Pengeluaran = 'pengeluaran',
}

@Schema({ timestamps: true, versionKey: false })
export class Transaction {
  @Prop({ type: String, enum: Object.values(TransactionType), required: true })
  type: TransactionType;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'TransactionCategory', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ deletedAt: 1 });
TransactionSchema.index({ categoryId: 1 });
TransactionSchema.index({ date: 1 });
TransactionSchema.index({ type: 1 });
