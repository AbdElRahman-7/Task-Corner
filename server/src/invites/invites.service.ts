import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from '../boards/schemas/board.schema';
import { Invite, InviteDocument } from '../boards/schemas/invite.schema';
import { Task, TaskDocument } from '../boards/schemas/task.schema';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';

// Reuses the existing CommonJS mailer used by Express (server/utils/email.js).
const sendEmail = require('../../utils/email');

@Injectable()
export class InvitesService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
    @InjectModel(Invite.name) private readonly inviteModel: Model<InviteDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    private readonly configService: ConfigService,
  ) {}

  async createInvite(
    email: string,
    boardId: string | undefined,
    workspaceId: string | undefined,
    taskId: string | undefined,
    role: string | undefined,
    origin: string | undefined,
  ) {
    const bId = boardId && boardId !== 'undefined' && boardId !== 'null' ? boardId : null;
    const wId = workspaceId && workspaceId !== 'undefined' && workspaceId !== 'null' ? workspaceId : null;
    const tId = taskId && taskId !== 'undefined' && taskId !== 'null' ? taskId : null;

    if (!email || (!bId && !wId)) {
      throw new BadRequestException('Email and either Board ID or Workspace ID are required');
    }

    if (bId && !Types.ObjectId.isValid(bId)) {
      throw new BadRequestException('Invalid Board ID');
    }
    if (wId && !Types.ObjectId.isValid(wId)) {
      throw new BadRequestException('Invalid Workspace ID');
    }
    if (tId && !Types.ObjectId.isValid(tId)) {
      throw new BadRequestException('Invalid Task ID');
    }

    const query: any = { email, status: 'pending' };
    if (bId) query.boardId = new Types.ObjectId(bId);
    if (wId) query.workspaceId = new Types.ObjectId(wId);
    if (tId) query.taskId = new Types.ObjectId(tId);

    const existingInvite = await this.inviteModel.findOne(query);
    if (existingInvite) {
      const clientUrl = this.configService.get<string>('CLIENT_URL');
      return {
        alreadyExists: true,
        message: 'Invite already sent',
        link: `${clientUrl}/invite/${existingInvite.token}`,
      };
    }

    const token = crypto.randomBytes(32).toString('hex');

    await this.inviteModel.create({
      email,
      boardId: bId ? new Types.ObjectId(bId) : undefined,
      workspaceId: wId ? new Types.ObjectId(wId) : undefined,
      taskId: tId ? new Types.ObjectId(tId) : undefined,
      token,
      role: role || 'viewer',
    });

    const clientUrl = (this.configService.get<string>('CLIENT_URL') || '').split(',')[0].trim();
    const resolvedOrigin = origin || clientUrl;
    const link = `${resolvedOrigin}/main/invite/${token}`;

    try {
      await sendEmail({
        email,
        subject: `You've been invited to ${bId ? 'a Board' : 'a Workspace'} on TaskCorner`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5;">You're Invited!</h2>
            <p>You have been invited to collaborate on TaskCorner.</p>
            <div style="margin: 30px 0;">
              <a href="${link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #4f46e5; font-size: 12px;">${link}</p>
          </div>
        `,
      });
    } catch {
      // Matches Express: email failures never fail the request, the link is still returned.
    }

    return {
      alreadyExists: false,
      message: 'Invite link generated successfully and email sent',
      link,
    };
  }

  async getInviteByToken(token: string) {
    const invite = await this.inviteModel.findOne({ token });
    if (!invite) {
      throw new NotFoundException('Invalid invite');
    }
    return invite;
  }

  async acceptInvite(token: string, user: { _id: Types.ObjectId; email: string }) {
    const invite = await this.inviteModel.findOne({ token, status: 'pending' });
    if (!invite) {
      throw new NotFoundException('Invalid or expired invite');
    }

    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException('This invite was sent to a different email address.');
    }

    let responseMessage = 'Successfully joined';
    let redirectId: Types.ObjectId | string = '';

    if (invite.workspaceId) {
      const workspace = await this.workspaceModel.findById(invite.workspaceId);
      if (!workspace) {
        throw new NotFoundException('Workspace no longer exists');
      }
      if (!workspace.members.some((m) => m.user?.toString() === user._id.toString())) {
        workspace.members.push({ user: user._id, role: (invite.role as 'viewer' | 'editor') || 'viewer' } as any);
        await workspace.save();
      }
      responseMessage = 'Successfully joined the workspace';
      redirectId = workspace._id as Types.ObjectId;
    }

    if (invite.boardId) {
      const board = await this.boardModel.findById(invite.boardId);
      if (!board) {
        throw new NotFoundException('Board no longer exists');
      }
      if (!board.members.some((m) => m.user?.toString() === user._id.toString())) {
        board.members.push({ user: user._id, role: (invite.role as 'viewer' | 'editor') || 'viewer' } as any);
        await board.save();
      }
      responseMessage = 'Successfully joined the board';
      redirectId = board._id as Types.ObjectId;

      if (invite.taskId) {
        const task = await this.taskModel.findById(invite.taskId);
        if (task) {
          const isAlreadyAssigned = task.assignments.some((a) => a.user?.toString() === user._id.toString());
          if (!isAlreadyAssigned) {
            const taskRole = invite.role === 'editor' ? 'editor' : 'viewer';
            const perms = invite.role === 'editor' ? { allActions: true } : {};
            task.assignments.push({ user: user._id, role: taskRole, permissions: perms } as any);
            await task.save();
          }
          responseMessage = `Successfully joined the board and assigned to task: ${task.title}`;
        }
      }
    }

    invite.status = 'accepted';
    await invite.save();

    return {
      message: responseMessage,
      id: redirectId,
      type: invite.workspaceId ? 'workspace' : 'board',
    };
  }

  async cancelInvite(inviteId: string, userId: Types.ObjectId) {
    const invite = await this.inviteModel.findById(inviteId);
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.boardId) {
      const board = await this.boardModel.findById(invite.boardId);
      if (!board || board.user.toString() !== userId.toString()) {
        throw new ForbiddenException('Not authorized to cancel this invite');
      }
    } else if (invite.workspaceId) {
      const workspace = await this.workspaceModel.findById(invite.workspaceId);
      if (!workspace || workspace.user.toString() !== userId.toString()) {
        throw new ForbiddenException('Not authorized to cancel this invite');
      }
    }

    await this.inviteModel.findByIdAndDelete(inviteId);
    return { message: 'Invite cancelled successfully' };
  }
}
