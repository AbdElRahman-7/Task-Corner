import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from '../boards/schemas/board.schema';
import { Invite, InviteDocument } from '../boards/schemas/invite.schema';
import { List, ListDocument } from '../boards/schemas/list.schema';
import { Task, TaskDocument } from '../boards/schemas/task.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

const sendEmail = require('../../utils/email');

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
    @InjectModel(List.name) private readonly listModel: Model<ListDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Invite.name) private readonly inviteModel: Model<InviteDocument>,
  ) {}

  async listUsers() {
    const users = await this.userModel.find({}, '-password').lean().exec();
    const allBoards = await this.boardModel.find({}).lean().exec();
    const allLists = await this.listModel.find({}).lean().exec();
    const allTasks = await this.taskModel.find({}).lean().exec();

    const usersWithStats = users.map((user: any) => {
      const userBoards = allBoards.filter(
        (b: any) =>
          b.user?.toString() === user._id.toString() ||
          b.members?.some((m: any) => m?.user?.toString() === user._id.toString()),
      );

      const boardIds = userBoards.map((b: any) => b._id.toString());
      const userLists = allLists.filter((l: any) => boardIds.includes(l.boardId?.toString()));
      const listIds = userLists.map((l: any) => l._id.toString());
      const userTasks = allTasks.filter((t: any) => listIds.includes(t.listId?.toString()));

      const taskStats = {
        total: userTasks.length,
        todo: userTasks.filter((t: any) => t.status === 'todo').length,
        inProgress: userTasks.filter(
          (t: any) => t.status === 'in-progress' || t.status === 'in progress',
        ).length,
        done: userTasks.filter((t: any) => t.status === 'done').length,
      };

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        status: user.status || 'active',
        createdAt: user.createdAt,
        boardsCount: userBoards.length,
        taskStats,
      };
    });

    return { success: true, users: usersWithStats };
  }

  async createUser(data: {
    username?: string;
    email?: string;
    password?: string;
    boardId?: string;
    role?: string;
    status?: string;
  }) {
    const { username, email, password, boardId, role, status } = data;

    if (!username || !email) {
      throw new BadRequestException('Username and email are required');
    }

    const existingEmail = await this.userModel.findOne({ email }).exec();
    if (existingEmail) {
      throw new BadRequestException('Email already taken');
    }

    const existingUser = await this.userModel.findOne({ username }).exec();
    if (existingUser) {
      throw new BadRequestException('Username already taken');
    }

    const user = await this.userModel.create({
      username,
      email,
      password: password || '123456',
      role: role === 'admin' ? 'admin' : 'user',
      status: status === 'disabled' ? 'disabled' : 'active',
    });

    if (boardId) {
      const board = await this.boardModel.findById(boardId).exec();
      if (board) {
        if (!board.members.some((m: any) => m.user?.toString() === user._id.toString())) {
          board.members.push({ user: user._id, role: (role as any) || 'viewer' } as any);
          await board.save();
        }
      }
    }

    return {
      success: true,
      user: { _id: user._id, username: user.username, email: user.email },
      message: 'User created successfully',
    };
  }

  async sendInvite(email: string, origin?: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const existingInvite = await this.inviteModel.findOne({ email, status: 'pending' }).exec();
    if (existingInvite) {
      const clientUrl = process.env.CLIENT_URL || '';
      return {
        alreadyExists: true,
        success: true,
        link: `${clientUrl}/invite/${existingInvite.token}`,
        message: 'Invite already sent',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    await this.inviteModel.create({ email, token });

    const resolvedOrigin =
      origin || (process.env.CLIENT_URL || '').split(',')[0].trim();
    const link = `${resolvedOrigin}/main/invite/${token}`;

    try {
      await sendEmail({
        email,
        subject: 'Invitation to join TaskCorner',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5;">Welcome to TaskCorner</h2>
            <p>You have been invited to join TaskCorner as a new user.</p>
            <div style="margin: 30px 0;">
              <a href="${link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Join Now</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #4f46e5; font-size: 12px;">${link}</p>
          </div>
        `,
      });
    } catch {
      // Matches Express: email failures never fail the request.
    }

    return {
      alreadyExists: false,
      success: true,
      link,
      message: 'Invite sent successfully and email delivered',
    };
  }

  async bulkDeleteUsers(ids: string[]) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No ids provided');
    }

    await this.boardModel.updateMany({}, { $pull: { members: { user: { $in: ids } } } }).exec();
    await this.taskModel.updateMany({}, { $pull: { assignments: { user: { $in: ids } } } }).exec();
    await this.userModel.deleteMany({ _id: { $in: ids } }).exec();

    return { success: true, message: `${ids.length} users deleted and cleaned up from boards/tasks` };
  }

  async deleteUser(id: string) {
    await this.boardModel.updateMany({}, { $pull: { members: { user: id } } }).exec();
    await this.taskModel.updateMany({}, { $pull: { assignments: { user: id } } }).exec();
    await this.userModel.findByIdAndDelete(id).exec();

    return { success: true, message: 'User deleted and cleaned up from boards/tasks' };
  }

  async updateUser(id: string, data: { username?: string; email?: string }) {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { username: data.username, email: data.email }, { new: true, select: '-password' })
      .exec();

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return { success: true, user: updated };
  }

  async getUserBoards(userId: string) {
    const oid = new Types.ObjectId(userId);
    const boards = await this.boardModel
      .find({ $or: [{ user: oid }, { 'members.user': oid }] })
      .lean()
      .exec();

    const boardRoles = boards.map((b: any) => {
      const isOwner = b.user.toString() === userId;
      let role = 'viewer';
      if (isOwner) {
        role = 'editor';
      } else {
        const member = b.members.find((m: any) => m.user?.toString() === userId);
        role = member ? member.role : 'viewer';
      }
      return {
        boardId: b._id,
        boardName: b.title,
        role,
      };
    });

    return { success: true, boardRoles };
  }

  async updateUserBoardRole(userId: string, boardId: string, role: string) {
    if (!['viewer', 'editor'].includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    const board = await this.boardModel.findOne({ _id: boardId }).exec();
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const memberIndex = board.members.findIndex((m: any) => m.user?.toString() === userId);
    if (memberIndex === -1) {
      throw new NotFoundException('User is not a member of this board');
    }

    board.members[memberIndex].role = role as any;
    await board.save();

    return { success: true, message: 'Role updated' };
  }
}
