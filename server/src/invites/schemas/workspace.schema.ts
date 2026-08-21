import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkspaceDocument = Workspace & Document;

@Schema({ _id: false })
export class WorkspaceMember {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ enum: ['viewer', 'editor'], default: 'viewer' })
  role: 'viewer' | 'editor';
}
export const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);

// Mirrors server/models/workspace.model.js — used internally by Invites only.
@Schema({ timestamps: true })
export class Workspace extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: [WorkspaceMemberSchema], default: [] })
  members: WorkspaceMember[];

  createdAt: Date;
  updatedAt: Date;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
