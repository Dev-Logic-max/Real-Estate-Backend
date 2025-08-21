import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UploadModule } from 'src/uploads/upload.module';
import { UserSeedService } from 'src/database/seed/user-seed.service';
import { NotificationModule } from 'src/notification/notification.module';
import { HistoryModule } from 'src/history/history.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UploadModule,
    // NotificationModule,
    forwardRef(() => NotificationModule), // Use forwardRef to break circular dependency
    HistoryModule
  ],
  providers: [UsersService, UserSeedService],
  controllers: [UsersController],
  exports: [UsersService],  // Export for use in Auth
})
export class UsersModule { }
