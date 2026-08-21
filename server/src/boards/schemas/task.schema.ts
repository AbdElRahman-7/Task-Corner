import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ _id: false })
export class ChecklistItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;

  @Prop({ default: false })
  done: boolean;
}
export const ChecklistItemSchema = SchemaFactory.createForClass(ChecklistItem);

@Schema({ _id: false })
export class TaskAssignment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ enum: ['viewer', 'commenter', 'editor'], default: 'viewer', required: true })
  role: 'viewer' | 'commenter' | 'editor';

  @Prop({
    type: {
      allActions: { type: Boolean, default: false },
      reorder: { type: Boolean, default: false },
      moveTask: { type: Boolean, default: false },
    },
    default: {},
  })
  permissions: { allActions: boolean; reorder: boolean; moveTask: boolean };
}
export const TaskAssignmentSchema = SchemaFactory.createForClass(TaskAssignment);

// Mirrors server/models/task.model.js — used internally by Boards only.
@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: 'low' | 'medium' | 'high';

  @Prop({ default: 'todo' })
  status: string;

  @Prop()
  dueDate: string;

  @Prop()
  assignee: string;

  @Prop({ type: [TaskAssignmentSchema], default: [] })
  assignments: TaskAssignment[];

  @Prop({ type: [String], default: [] })
  labels: string[];

  @Prop({ type: [ChecklistItemSchema], default: [] })
  checklist: ChecklistItem[];

  @Prop({ type: Types.ObjectId, ref: 'List', required: true })
  listId: Types.ObjectId;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: false })
  autoDone: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
