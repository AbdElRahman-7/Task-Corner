import { Body, Controller, Delete, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async createTask(@Req() req: any, @Body() body: { listId: string; title: string; order?: number }) {
    return this.tasksService.createTask(req.user._id, body.listId, body.title, body.order);
  }

  @Put(':id')
  async updateTask(@Req() req: any, @Param('id') id: string, @Body() updates: Record<string, any>) {
    return this.tasksService.updateTask(req.user._id, id, updates);
  }

  @Put(':id/move')
  async moveTask(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { toListId: string; newIndex: number },
  ) {
    return this.tasksService.moveTask(req.user._id, id, body.toListId, body.newIndex);
  }

  @Delete(':id')
  async deleteTask(@Req() req: any, @Param('id') id: string) {
    return this.tasksService.deleteTask(req.user._id, id);
  }
}
