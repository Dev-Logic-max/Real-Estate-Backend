// import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { NotificationService } from './notification.service';

// @WebSocketGateway()
// export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer() server: Server;

//   constructor(private notificationService: NotificationService) {}

//   handleConnection(client: Socket) {
//     console.log(`Client connected: ${client.id}`);
//   }

//   handleDisconnect(client: Socket) {
//     console.log(`Client disconnected: ${client.id}`);
//   }

//   @SubscribeMessage('join')
//   handleJoin(client: Socket, userId: string) {
//     client.join(userId);
//   }

//   async sendNotification(userId: string, notification: any) {
//     this.server.to(userId).emit('notification', notification);
//   }
// }


// // Notification module code:

// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { NotificationService } from './notification.service';
// import { NotificationController } from './notification.controller';
// import { Notification, NotificationSchema } from './schemas/notification.schema';
// import { NotificationGateway } from './notification.gateway';
// import { PropertyModule } from 'src/property/property.module'; // Adjust path
// import { UsersModule } from 'src/users/users.module'; // Adjust path

// @Module({
//   imports: [
//     MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
//     PropertyModule,
//     UsersModule,
//   ],
//   controllers: [NotificationController],
//   providers: [NotificationService, NotificationGateway],
//   exports: [NotificationService],
// })
// export class NotificationModule {}




// Update NotificationService:
// Modify sendNotificationToUsers to use the gateway:
// typescriptasync sendNotificationToUsers(notification: NotificationDocument, users: any[]): Promise<void> {
//   users.forEach(async (user) => {
//     if (notification.type === 'in-app') {
//       const gateway = new NotificationGateway(this.notificationService); // Inject via constructor in production
//       await gateway.sendNotification(user._id.toString(), {
//         message: notification.message,
//         read: notification.read,
//         type: notification.type,
//         eventType: notification.eventType,
//       });
//       console.log(`Sent in-app notification to ${user._id}`);
//     } else if (notification.type === 'email') {
//       console.log(`Sending email to ${user.email}: ${notification.message}`);
//     }
//   });
// }


import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';
// import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@WebSocketGateway({ cors: true })
export class NotificationGateway {
//   constructor(private notificationService: NotificationService) {}

  @SubscribeMessage('connectUser')
  async handleConnect(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    client.join(data.userId); // Join room based on userId
  }

  async sendNotification(createNotificationDto: CreateNotificationDto) {
    // const notification = await this.notificationService.send(createNotificationDto);
    // // Emit to users with allowed roles
    // createNotificationDto.allowedRoles.forEach(role => {
    // //   this.server.to(role).emit('notification', notification); // Emit to role-based rooms (implement role rooms)
    // });
    // // this.server.to(createNotificationDto.userId).emit('notification', notification); // Emit to specific user


    const { userId, allowedRoles } = createNotificationDto;
    // Emit to specific user
    // this.server.to(userId).emit('notification', createNotificationDto);
    // Emit to users with allowed roles (room per role could be implemented)
    // allowedRoles.forEach(role => this.server.to(role.toString()).emit('notification', createNotificationDto));
  }
}