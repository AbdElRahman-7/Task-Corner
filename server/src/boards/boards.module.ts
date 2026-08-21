import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { Board, BoardSchema } from './schemas/board.schema';
import { List, ListSchema } from './schemas/list.schema';
import { Task, TaskSchema } from './schemas/task.schema';
import { Invite, InviteSchema } from './schemas/invite.schema';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: List.name, schema: ListSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Invite.name, schema: InviteSchema },
    ]),
  ],
  controllers: [BoardsController],
  providers: [BoardsService, JwtAuthGuard],
})
export class BoardsModule {}
