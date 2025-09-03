import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
}

export enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  DANA = 'Dana',
  QRIS = 'QRIS',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Order', default: null })
  orderGroupId: Types.ObjectId;

  @Prop({ required: true })
  uniqueCode: string;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId: Types.ObjectId;

  @Prop({ enum: OrderStatus, default: OrderStatus.REQUESTED })
  status: OrderStatus;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Prop({ enum: PaymentMethod, default: null })
  paymentMethod: PaymentMethod;

  @Prop({ default: false })
  pickupDelivery: boolean;

  @Prop({ default: null })
  pickupNote: string;

  @Prop({ default: null })
  startDate: Date;

  @Prop({ default: null })
  endDate: Date;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: null })
  photoBefore: string;

  @Prop({ default: null })
  photoBeforeId: string;

  @Prop({ default: null })
  photoBeforeUrl: string;

  @Prop({ default: null })
  photoAfter: string;

  @Prop({ default: null })
  photoAfterId: string;

  @Prop({ default: null })
  photoAfterUrl: string;

  @Prop({ default: null })
  serviceNote: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ isDeleted: 1 });
OrderSchema.index({ orderGroupId: 1 });
OrderSchema.index({ uniqueCode: 1 });
OrderSchema.index({ serviceId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
