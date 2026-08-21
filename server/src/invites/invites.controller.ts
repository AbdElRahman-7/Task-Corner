import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvitesService } from './invites.service';

@Controller('invite')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createInvite(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { email: string; boardId?: string; workspaceId?: string; taskId?: string; role?: string },
  ) {
    const origin = req.get('origin');
    const result = await this.invitesService.createInvite(
      body.email,
      body.boardId,
      body.workspaceId,
      body.taskId,
      body.role,
      origin,
    );

    res.status(result.alreadyExists ? 200 : 201);
    return { message: result.message, link: result.link };
  }

  @Get(':token')
  async getInviteByToken(@Param('token') token: string) {
    return this.invitesService.getInviteByToken(token);
  }

  @Post(':token/accept')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async acceptInvite(@Req() req: any, @Param('token') token: string) {
    return this.invitesService.acceptInvite(token, { _id: req.user._id, email: req.user.email });
  }

  @Delete(':inviteId')
  @UseGuards(JwtAuthGuard)
  async cancelInvite(@Req() req: any, @Param('inviteId') inviteId: string) {
    return this.invitesService.cancelInvite(inviteId, req.user._id);
  }
}
