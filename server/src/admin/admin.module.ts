import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { Board, BoardSchema } from '../boards/schemas/board.schema';
import { Invite, InviteSchema } from '../boards/schemas/invite.schema';
import { List, ListSchema } from '../boards/schemas/list.schema';
import { Task, TaskSchema } from '../boards/schemas/task.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

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
      { name: User.name, schema: UserSchema },
      { name: Board.name, schema: BoardSchema },
      { name: List.name, schema: ListSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Invite.name, schema: InviteSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, JwtAuthGuard, AdminGuard],
})
export class AdminModule {}
