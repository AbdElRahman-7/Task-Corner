import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from '../boards/schemas/board.schema';
import { List, ListDocument } from '../boards/schemas/list.schema';
import { Task, TaskDocument } from '../boards/schemas/task.schema';

@Injectable()
export class ListsService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
    @InjectModel(List.name) private readonly listModel: Model<ListDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  private async assertBoardAccess(boardId: Types.ObjectId | string, userId: Types.ObjectId) {
    const board = await this.boardModel.findOne({
      _id: boardId,
      $or: [{ user: userId }, { members: { $elemMatch: { user: userId, role: 'editor' } } }],
    });
    return board;
  }

  async createList(userId: Types.ObjectId, boardId: string, title: string) {
    const board = await this.assertBoardAccess(boardId, userId);
    if (!board) {
      throw new ForbiddenException('No permission to create lists on this board');
    }

    // `List` schema has no `user` field (matches Express, which also silently drops it here).
    return this.listModel.create({ title, boardId: new Types.ObjectId(boardId) });
  }

  async updateList(userId: Types.ObjectId, id: string, title: string) {
    const list = await this.listModel.findById(id);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const board = await this.assertBoardAccess(list.boardId, userId);
    if (!board) {
      throw new ForbiddenException('No permission to update this list');
    }

    list.title = title || list.title;
    return list.save();
  }

  async deleteList(userId: Types.ObjectId, id: string) {
    const list = await this.listModel.findById(id);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    const board = await this.assertBoardAccess(list.boardId, userId);
    if (!board) {
      throw new ForbiddenException('No permission to delete this list');
    }

    await this.taskModel.deleteMany({ listId: id });
    await list.deleteOne();

    return { message: 'List removed', listId: id };
  }
}
