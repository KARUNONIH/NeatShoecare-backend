import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InstagramPostDocument = InstagramPost & Document;

@Schema({ timestamps: true })
export class InstagramPost {
  @Prop({ required: true })
  postId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  photoAfterUrl: string;

  @Prop({ required: true })
  caption: string;

  @Prop({ default: null })
  permalink: string;

  @Prop({ default: null })
  publishedAt: Date;

  @Prop({ default: null })
  takedownAt: Date;

  @Prop({ default: false })
  isPublish: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: Date;

  @Prop({ default: false })
  isSimulated: boolean;

  @Prop({ default: null })
  simulationNote: string;

  @Prop({ default: 'draft' })
  status: string; // 'draft', 'pending_manual', 'published', 'failed', 'taken_down'

  createdAt: Date;
  updatedAt: Date;
}

export const InstagramPostSchema = SchemaFactory.createForClass(InstagramPost);

// Indexes untuk performance
InstagramPostSchema.index({ isDeleted: 1 });
InstagramPostSchema.index({ orderId: 1 });
InstagramPostSchema.index({ postId: 1 });
InstagramPostSchema.index({ isPublish: 1 });
InstagramPostSchema.index({ publishedAt: 1 });
InstagramPostSchema.index({ isSimulated: 1 });
