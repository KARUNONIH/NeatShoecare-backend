import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  UNASSIGNED = 'unassigned',
}

@Schema({ versionKey: false })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  branchId: string;

  @Prop({ enum: UserRole, default: UserRole.UNASSIGNED })
  role: UserRole;

  @Prop()
  googleId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);