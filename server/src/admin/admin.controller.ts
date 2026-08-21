import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Post('users')
  async createUser(
    @Body() body: { username?: string; email?: string; password?: string; boardId?: string; role?: string; status?: string },
  ) {
    return this.adminService.createUser(body);
  }

  @Post('invite')
  async sendInvite(@Body() body: { email?: string }, @Req() req: any, @Res() res: Response) {
    const origin = req.get('origin');
    const result = await this.adminService.sendInvite(body.email, origin);
    // Matches Express: 200 for already-sent, 201 for new invite
    const status = result.alreadyExists ? 200 : 201;
    return res.status(status).json(result);
  }

  // NOTE: /users/bulk MUST come before /users/:id
  @Delete('users/bulk')
  async bulkDeleteUsers(@Body() body: { ids?: string[] }) {
    return this.adminService.bulkDeleteUsers(body.ids);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: { username?: string; email?: string }) {
    return this.adminService.updateUser(id, body);
  }

  @Get('users/:id/boards')
  async getUserBoards(@Param('id') id: string) {
    return this.adminService.getUserBoards(id);
  }

  @Put('users/:id/boards/:boardId/role')
  async updateUserBoardRole(
    @Param('id') id: string,
    @Param('boardId') boardId: string,
    @Body() body: { role?: string },
  ) {
    return this.adminService.updateUserBoardRole(id, boardId, body.role);
  }
}
