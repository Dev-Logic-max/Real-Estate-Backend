import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RoleEnum } from '../../common/enums/role.enum';
import { StatusEnum } from '../../common/enums/status.enum';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class UserSeedService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async run() {
    console.log('Starting user seeding process...');

    // Seed Admin User
    const adminEmail = 'admin@example.com';
    const admin = await this.userModel.findOne({ email: adminEmail });

    if (!admin) {
      console.log(`Seeding admin user: ${adminEmail}`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const adminData = new this.userModel({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Evelyn',
        lastName: 'Harris',
        roles: [RoleEnum.Admin], // Numeric role ID (1)
        status: StatusEnum.Active, // String value 'active'
        phone: '+1-312-555-0178', // USA format
        address: {
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'Illinois',
          country: 'USA',
          zipCode: '62704',
        },
        profilePhotos: [], 
        connections: [],
      });
      await adminData.save();
      console.log('Admin user seeded successfully');
    } else {
      console.log(`Admin user ${adminEmail} already exists, skipping...`);
    }

    // Seed Regular User
    const userEmail = 'user@example.com';
    const user = await this.userModel.findOne({ email: userEmail });

    if (!user) {
      console.log(`Seeding regular user: ${userEmail}`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('user123', salt);

      const userData = new this.userModel({
        email: userEmail,
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        roles: [RoleEnum.User], // Numeric role ID (2)
        status: StatusEnum.Active, // String value 'active'
        phone: '+44-20-7946-0958', // UK format
        address: {
          street: '221B Baker Street',
          city: 'London',
          state: 'Greater London',
          country: 'United Kingdom',
          zipCode: 'NW1 6XE',
        },
        profilePhotos: [], 
        connections: [], 
      });
      await userData.save();
      console.log('Regular user seeded successfully');
    } else {
      console.log(`Regular user ${userEmail} already exists, skipping...`);
    }
  }
}