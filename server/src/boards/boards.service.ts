import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from './schemas/board.schema';
import { List, ListDocument } from './schemas/list.schema';
import { Task, TaskDocument } from './schemas/task.schema';
import { Invite, InviteDocument } from './schemas/invite.schema';

const DEFAULT_LISTS = ['Todo', 'In Progress', 'Done', 'Custom'];

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
    @InjectModel(List.name) private readonly listModel: Model<ListDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Invite.name) private readonly inviteModel: Model<InviteDocument>,
  ) {}

  async getBoards(userId: Types.ObjectId, status?: string) {
    const query: any = {
      $or: [{ user: userId }, { 'members.user': userId }],
    };

    if (status === 'archived') {
      query.isArchived = true;
    } else if (status === 'active') {
      query.isArchived = false;
    }

    return this.boardModel
      .find(query)
      .populate('user', 'username email')
      .populate('members.user', 'username email');
  }

  async getBoardData(boardId: string, userId: Types.ObjectId) {
    const board = await this.boardModel
      .findOne({
        _id: boardId,
        $or: [{ user: userId }, { 'members.user': userId }],
      })
      .populate('user', 'username email')
      .populate('members.user', 'username email');

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const lists = await this.listModel.find({ boardId: board._id }).sort({ order: 1 });

    for (let i = 0; i < DEFAULT_LISTS.length; i++) {
      const exists = lists.some((l) => l.title === DEFAULT_LISTS[i]);
      if (!exists) {
        const newList = await this.listModel.create({
          title: DEFAULT_LISTS[i],
          boardId: board._id,
          order: i,
        });
        lists.push(newList);
      }
    }

    const listIds = lists.map((l) => l._id);

    const tasks = await this.taskModel
      .find({ listId: { $in: listIds } })
      .populate('assignments.user', 'username email')
      .populate('listId', 'title');

    const invites = await this.inviteModel.find({ boardId, status: 'pending' });

    return { board, lists, tasks, invites };
  }

  async createBoard(userId: Types.ObjectId, title: string, members?: Array<{ email?: string; name?: string; role?: string }>) {
    const board = await this.boardModel.create({
      title,
      user: userId,
      members: [{ user: userId, role: 'editor' }],
    });

    if (members && Array.isArray(members)) {
      for (const m of members) {
        if (!m.email) continue;

        const normalizedEmail = m.email.toLowerCase();
        // Reuse the User model already registered by UsersModule on the shared connection.
        const user: any = await this.boardModel.db.model('User').findOne({ email: normalizedEmail });

        if (user) {
          const isAlreadyMember = board.members.some(
            (member) => member.user?.toString() === (user._id as Types.ObjectId).toString(),
          );

          if (!isAlreadyMember) {
            board.members.push({ user: user._id, role: (m.role as 'viewer' | 'editor') || 'viewer' } as any);
          }
        } else {
          const token = crypto.randomBytes(32).toString('hex');

          await this.inviteModel.create({
            email: normalizedEmail,
            name: m.name,
            boardId: board._id,
            token,
            role: m.role || 'viewer',
          });
        }
      }

      await board.save();
    }

    const createdLists = await Promise.all(
      DEFAULT_LISTS.map((title, index) => this.listModel.create({ title, boardId: board._id, order: index })),
    );

    const populatedBoard = await this.boardModel.findById(board._id).populate('members.user', 'username email');

    return {
      board: populatedBoard,
      lists: createdLists,
      tasks: [],
    };
  }

  async deleteBoard(boardId: string, userId: Types.ObjectId) {
    const board = await this.boardModel.findOne({ _id: boardId, user: userId });
    if (!board) {
      throw new NotFoundException('Board not found or unauthorized');
    }

    const lists = await this.listModel.find({ boardId: board._id });
    const listIds = lists.map((l) => l._id);

    await this.taskModel.deleteMany({ listId: { $in: listIds } });
    await this.listModel.deleteMany({ boardId: board._id });
    await this.boardModel.deleteOne({ _id: board._id });

    return { message: 'Board removed', boardId };
  }

  async updateBoard(boardId: string, userId: Types.ObjectId, updates: Record<string, any>) {
    const board = await this.boardModel
      .findOneAndUpdate(
        {
          _id: boardId,
          $or: [{ user: userId }, { members: { $elemMatch: { user: userId, role: 'editor' } } }],
        },
        { $set: updates },
        { returnDocument: 'after' },
      )
      .populate('members.user', 'username email');

    if (!board) {
      throw new NotFoundException('Board not found or unauthorized');
    }

    return board;
  }

  async updateMemberRole(boardId: string, userId: Types.ObjectId, targetUserId: string, role: string) {
    if (!['viewer', 'editor'].includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    const board = await this.boardModel.findOne({ _id: boardId, user: userId });
    if (!board) {
      throw new ForbiddenException('Only owners can change roles');
    }

    const memberIndex = board.members.findIndex((m) => m.user?.toString() === targetUserId);
    if (memberIndex === -1) {
      throw new NotFoundException('Member not found');
    }

    board.members[memberIndex].role = role as 'viewer' | 'editor';
    await board.save();

    return this.boardModel.findById(boardId).populate('members.user', 'username email');
  }

  async removeMember(boardId: string, userId: Types.ObjectId, targetUserId: string) {
    const board = await this.boardModel.findOne({ _id: boardId, user: userId });
    if (!board) {
      throw new ForbiddenException('Only owners can remove members');
    }

    if (targetUserId === board.user.toString()) {
      throw new BadRequestException('Cannot remove the board owner');
    }

    board.members = board.members.filter((m) => m.user?.toString() !== targetUserId) as any;
    await board.save();

    return this.boardModel.findById(boardId).populate('members.user', 'username email');
  }
}
