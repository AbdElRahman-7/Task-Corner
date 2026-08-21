import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InviteDocument = Invite & Document;

// Mirrors server/models/invite.model.js — used internally by Boards only.
@Schema()
export class Invite extends Document {
  @Prop({ required: true })
  email: string;

  @Prop()
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Board' })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace' })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  taskId: Types.ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop({ enum: ['viewer', 'editor'], default: 'viewer' })
  role: 'viewer' | 'editor';

  @Prop({ enum: ['pending', 'accepted'], default: 'pending' })
  status: 'pending' | 'accepted';

  @Prop({ default: Date.now, expires: '7d' })
  createdAt: Date;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);
