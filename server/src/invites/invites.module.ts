import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { Board, BoardSchema } from '../boards/schemas/board.schema';
import { Invite, InviteSchema } from '../boards/schemas/invite.schema';
import { Task, TaskSchema } from '../boards/schemas/task.schema';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

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
      { name: Invite.name, schema: InviteSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
  ],
  controllers: [InvitesController],
  providers: [InvitesService, JwtAuthGuard],
})
export class InvitesModule {}
