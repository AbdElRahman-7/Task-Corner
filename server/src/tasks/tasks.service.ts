import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from '../boards/schemas/board.schema';
import { List, ListDocument } from '../boards/schemas/list.schema';
import { Task, TaskDocument } from '../boards/schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
    @InjectModel(List.name) private readonly listModel: Model<ListDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  private async assertBoardEditorAccess(boardId: Types.ObjectId | string, userId: Types.ObjectId) {
    return this.boardModel.findOne({
      _id: boardId,
      $or: [{ user: userId }, { members: { $elemMatch: { user: userId, role: 'editor' } } }],
    });
  }

  async createTask(userId: Types.ObjectId, listId: string, title: string, order?: number) {
    const list = await this.listModel.findById(listId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const board = await this.assertBoardEditorAccess(list.boardId, userId);
    if (!board) {
      throw new ForbiddenException('No editor permission on this board');
    }

    return this.taskModel.create({ title, listId: new Types.ObjectId(listId), order });
  }

  async updateTask(userId: Types.ObjectId, id: string, updates: Record<string, any>) {
    const currentTask = await this.taskModel.findById(id);
    if (!currentTask) {
      throw new NotFoundException('Task not found');
    }

    const list = await this.listModel.findById(currentTask.listId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const board = await this.assertBoardEditorAccess(list.boardId, userId);
    if (!board) {
      throw new ForbiddenException('No editor permission on this board');
    }

    return this.taskModel.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
  }

  async deleteTask(userId: Types.ObjectId, id: string) {
    const currentTask = await this.taskModel.findById(id);
    if (!currentTask) {
      throw new NotFoundException('Task not found');
    }

    const list = await this.listModel.findById(currentTask.listId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const board = await this.assertBoardEditorAccess(list.boardId, userId);
    if (!board) {
      throw new ForbiddenException('No editor permission on this board');
    }

    await this.taskModel.findByIdAndDelete(id);
    return { message: 'Task removed', taskId: id };
  }

  async moveTask(userId: Types.ObjectId, id: string, toListId: string, newIndex: number) {
    const task = await this.taskModel.findById(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Matches Express: permission is checked against the task's current list/board only.
    const list = await this.listModel.findById(task.listId);
    const toList = await this.listModel.findById(toListId);
    if (!toList) {
      throw new NotFoundException('Destination list not found');
    }

    const board = await this.assertBoardEditorAccess(list.boardId, userId);
    if (!board) {
      throw new ForbiddenException('No editor permission');
    }

    const status = toList.title.toLowerCase();
    task.listId = new Types.ObjectId(toListId);
    task.order = newIndex;
    task.status = status;
    await task.save();

    return task;
  }
}
