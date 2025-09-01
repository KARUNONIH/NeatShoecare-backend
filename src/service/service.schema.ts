import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CategoryService } from '../category-service/category-service.schema';

export type ServiceDocument = Service & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Service {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'CategoryService', required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop()
  description: string;

  @Prop({ required: true })
  duration: string;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// Add index for soft delete queries
ServiceSchema.index({ deletedAt: 1 });
ServiceSchema.index({ categoryId: 1 });
