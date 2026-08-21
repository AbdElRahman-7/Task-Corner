import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardsService } from './boards.service';

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  async getBoards(@Req() req: any, @Query('status') status?: string) {
    return this.boardsService.getBoards(req.user._id, status);
  }

  @Get(':boardId')
  async getBoardData(@Req() req: any, @Param('boardId') boardId: string) {
    return this.boardsService.getBoardData(boardId, req.user._id);
  }

  @Post()
  async createBoard(
    @Req() req: any,
    @Body() body: { title: string; members?: Array<{ email?: string; name?: string; role?: string }> },
  ) {
    return this.boardsService.createBoard(req.user._id, body.title, body.members);
  }

  @Put(':boardId')
  async updateBoard(@Req() req: any, @Param('boardId') boardId: string, @Body() updates: Record<string, any>) {
    return this.boardsService.updateBoard(boardId, req.user._id, updates);
  }

  @Delete(':boardId')
  async deleteBoard(@Req() req: any, @Param('boardId') boardId: string) {
    return this.boardsService.deleteBoard(boardId, req.user._id);
  }

  @Put(':boardId/members/:userId')
  async updateMemberRole(
    @Req() req: any,
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
    @Body() body: { role: string },
  ) {
    return this.boardsService.updateMemberRole(boardId, req.user._id, userId, body.role);
  }

  @Delete(':boardId/members/:userId')
  async removeMember(@Req() req: any, @Param('boardId') boardId: string, @Param('userId') userId: string) {
    return this.boardsService.removeMember(boardId, req.user._id, userId);
  }
}
