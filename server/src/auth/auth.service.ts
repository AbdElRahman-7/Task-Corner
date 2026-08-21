import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from '../boards/schemas/board.schema';
import { Invite, InviteDocument } from '../boards/schemas/invite.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(Board.name) private readonly boardModel: Model<BoardDocument>,
    @InjectModel(Invite.name) private readonly inviteModel: Model<InviteDocument>,
  ) {}

  async register(username: string, email: string, password: string) {
    if (!username || !email) {
      throw new BadRequestException('Username and email are required');
    }

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already taken');
    }

    const existingUsername = await this.usersService.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const user = await this.usersService.create({ username, email, password });

    // Auto-join pending invites (matches Express behavior)
    const userId = new Types.ObjectId((user as any)._id);
    await this.processPendingInvites(email.toLowerCase(), userId);

    const payload = { sub: userId, id: userId, email };
    const token = this.jwtService.sign(payload);

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Auto-join pending invites (matches Express behavior)
    const userId = new Types.ObjectId(user._id);
    await this.processPendingInvites(user.email, userId);

    const payload = { sub: user._id, id: user._id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      token,
    };
  }

  private async processPendingInvites(email: string, userId: Types.ObjectId) {
    const invites = await this.inviteModel.find({ email, status: 'pending' }).exec();

    for (const invite of invites) {
      if (invite.boardId) {
        const board = await this.boardModel.findById(invite.boardId).exec();
        if (board) {
          if (!Array.isArray(board.members)) board.members = [] as any;
          if (!board.members.some((m: any) => m.user?.toString() === userId.toString())) {
            (board as any).members.push({ user: userId, role: 'viewer' });
            await board.save();
          }
        }
      }
      invite.status = 'accepted' as any;
      await invite.save();
    }
  }
}
