import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ListDocument = List & Document;

// Mirrors server/models/list.model.js — used internally by Boards only.
@Schema({ timestamps: true })
export class List extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Board', required: true })
  boardId: Types.ObjectId;

  @Prop({ default: 0 })
  order: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ListSchema = SchemaFactory.createForClass(List);
