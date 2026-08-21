import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BoardDocument = Board & Document;

@Schema({ _id: false })
export class BoardMember {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ enum: ['viewer', 'editor'], default: 'viewer' })
  role: 'viewer' | 'editor';
}

export const BoardMemberSchema = SchemaFactory.createForClass(BoardMember);

@Schema({ timestamps: true })
export class Board extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: [BoardMemberSchema], default: [] })
  members: BoardMember[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ default: false })
  isArchived: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const BoardSchema = SchemaFactory.createForClass(Board);
