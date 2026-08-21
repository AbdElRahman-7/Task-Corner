import { Body, Controller, Delete, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListsService } from './lists.service';

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  async createList(@Req() req: any, @Body() body: { boardId: string; title: string }) {
    return this.listsService.createList(req.user._id, body.boardId, body.title);
  }

  @Put(':id')
  async updateList(@Req() req: any, @Param('id') id: string, @Body() body: { title: string }) {
    return this.listsService.updateList(req.user._id, id, body.title);
  }

  @Delete(':id')
  async deleteList(@Req() req: any, @Param('id') id: string) {
    return this.listsService.deleteList(req.user._id, id);
  }
}
