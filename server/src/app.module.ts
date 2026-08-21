import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BoardsModule } from './boards/boards.module';
import { ListsModule } from './lists/lists.module';
import { TasksModule } from './tasks/tasks.module';
import { InvitesModule } from './invites/invites.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        dbName: 'taskcorner',
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 1000,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    BoardsModule,
    ListsModule,
    TasksModule,
    InvitesModule,
    AdminModule,
  ],
})
export class AppModule {}
