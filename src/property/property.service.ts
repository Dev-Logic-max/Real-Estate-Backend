import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';
import { UploadService } from 'src/uploads/upload.service';
import { CreateNotificationDto } from 'src/notification/dto/create-notification.dto';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationPurposeEnum } from 'src/common/enums/notification.enum';
import { StatusEnum } from 'src/common/enums/status.enum';
import { RoleEnum } from 'src/common/enums/role.enum';
import * as fs from 'fs/promises'; // Import fs promises API
import * as path from 'path'; // Import path module

@Injectable()
export class PropertyService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    private uploadService: UploadService, // Inject UploadService
    private notificationService: NotificationService,
  ) { }

  async createProperty(createPropertyDto: CreatePropertyDto, user: any): Promise<PropertyDocument> {
    if (!user.roles.includes(RoleEnum.Seller) && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('Only sellers, or admins can create properties');
    }
    const newProperty = new this.propertyModel({
      ...createPropertyDto,
      ownerId: user.userId,
      agents: [], // Initialize agents array
    });
    const savedProperty = await newProperty.save();

    // Send notification to owner and allowed roles
    const notificationDto: CreateNotificationDto = {
      userId: user.userId, // Owner gets notified too
      message: `A new property "${createPropertyDto.title}" has been created by ${user.firstName} ${user.lastName || ''}.`,
      type: 'email',
      allowedRoles: [RoleEnum.Admin, RoleEnum.Seller], // Notify admins and sellers
      purpose: NotificationPurposeEnum.PROPERTY_CREATED,
      relatedId: savedProperty._id?.toString(),
      relatedModel: 'Property',
    };
    await this.notificationService.send(notificationDto);

    return savedProperty;
  }

  async updateProperty(id: string, updatePropertyDto: UpdatePropertyDto, user: any): Promise<PropertyDocument> {
    const property = await this.getPropertyByPropertyId(id);
    if (property.ownerId.toString() !== user.userId && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('You can only update your own properties');
    }
    const updated = await this.propertyModel.findByIdAndUpdate(id, updatePropertyDto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Update failed');

    // Send notification to owner
    const notificationDto: CreateNotificationDto = {
      userId: user.userId,
      message: `You have updated the property "${updated.title}".`,
      type: 'in-app',
      allowedRoles: [], // Only notify the owner
      purpose: NotificationPurposeEnum.PROPERTY_UPDATED,
      relatedId: updated._id?.toString(),
      relatedModel: 'Property',
    };
    await this.notificationService.send(notificationDto);

    return updated;
  }

  async deleteProperty(id: string, user: any): Promise<void> {
    const property = await this.getPropertyByPropertyId(id);
    if (property.ownerId.toString() !== user.userId && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('You can only delete your own properties');
    }
    await this.propertyModel.deleteOne({ _id: id });

    // Send notification to owner
    const notificationDto: CreateNotificationDto = {
      userId: user.userId,
      message: `You have deleted the property "${property.title}".`,
      type: 'email',
      allowedRoles: [RoleEnum.Admin], // Notify Admins
      purpose: NotificationPurposeEnum.PROPERTY_DELETED,
      relatedId: property._id?.toString(),
      relatedModel: 'Property',
    };
    await this.notificationService.send(notificationDto);
  }

  async getAllProperties(searchDto: SearchPropertyDto): Promise<{ properties: PropertyDocument[]; total: number }> {
    const { minPrice, maxPrice, minArea, maxArea, type, page = 1, limit = 10 } = searchDto;
    // const filter: any = { status: 'active' };
    const filter: any = {};
    if (minPrice) filter.price = { $gte: minPrice };
    if (maxPrice) filter.price = { ...filter.price, $lte: maxPrice };
    if (minArea) filter.area = { $gte: minArea };
    if (maxArea) filter.area = { ...filter.area, $lte: maxArea };
    if (type) filter.type = type;

    const properties = await this.propertyModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.propertyModel.countDocuments(filter);

    return { properties, total };
  }

  async getApprovedProperties(searchDto: SearchPropertyDto): Promise<{ properties: PropertyDocument[]; total: number }> {
    const { minPrice, maxPrice, minArea, maxArea, type, page = 1, limit = 10 } = searchDto;
    const filter: any = { status: StatusEnum.Active }; // Only active properties

    if (minPrice) filter.price = { $gte: minPrice };
    if (maxPrice) filter.price = { ...filter.price, $lte: maxPrice };
    if (minArea) filter.area = { $gte: minArea };
    if (maxArea) filter.area = { ...filter.area, $lte: maxArea };
    if (type) filter.type = type;

    const properties = await this.propertyModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.propertyModel.countDocuments(filter);

    return { properties, total };
  }

  async updatePropertyStatusByAdmin(id: string, updateStatusDto: { status: string }, user: any): Promise<PropertyDocument> {
    if (!user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('Only admins can update property status');
    }
    const property = await this.getPropertyByPropertyId(id);
    if (!Object.values(StatusEnum).includes(updateStatusDto.status as any)) {
      throw new BadRequestException('Invalid status value');
    }
    if (property.status === updateStatusDto.status) {
      throw new BadRequestException(`Property is already ${property.status}`);
    }
    property.status = updateStatusDto.status;
    const updatedProperty = await property.save();

    // Send notification to owner and admin
    const notificationDto: CreateNotificationDto = {
      userId: property.ownerId.toString(),
      message: `Your property "${property.title}" status has been updated to ${updatedProperty.status}.`,
      type: 'in-app',
      allowedRoles: [RoleEnum.Admin], // Notify admins and the owner (via userId)
      purpose: NotificationPurposeEnum.PROPERTY_STATUS_CHANGED,
      relatedId: property._id?.toString(),
      relatedModel: 'Property',
    };
    await this.notificationService.send(notificationDto);

    return updatedProperty;
  }

  async getPropertyByOwnerId(userId: string): Promise<{ properties: PropertyDocument[]; total: number }> {
    const filter: any = { ownerId: userId };
    const properties = await this.propertyModel.find(filter).exec();
    const total = await this.propertyModel.countDocuments(filter).exec();
    return { properties, total };
  }

  async getPropertyByPropertyId(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).exec();
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async addImages(id: string, files: Express.Multer.File[], user: any): Promise<string[]> {
    const property = await this.getPropertyByPropertyId(id);
    if (property.ownerId.toString() !== user.userId && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('You can only upload images for your own properties');
    }
    if (property.images && property.images.length >= 12) {
      throw new BadRequestException('Maximum 12 images allowed per property');
    }
    if (!property.images) property.images = [];
    const newPaths = await Promise.all(files.map(file => this.uploadService.uploadFile(file, 'property')));
    const totalNewImages = property.images.length + newPaths.length;
    if (totalNewImages > 12) {
      throw new BadRequestException(`Adding ${newPaths.length} images would exceed the 12-image limit. Current: ${property.images.length}, Max: 12`);
    }
    property.images.push(...newPaths);
    await property.save();
    return newPaths; // Return array of new paths
  }

  async removeImage(propertyId: string, imageUrl: string, user: any): Promise<{ message: string }> {
    const property = await this.getPropertyByPropertyId(propertyId);
    if (property.ownerId.toString() !== user.userId && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('You can only delete images for your own properties');
    }
    if (!property.images || !property.images.includes(imageUrl)) {
      throw new BadRequestException('Image not found in property');
    }

    // Construct the full file path
    const basePath = './uploads/property';
    const fileName = path.basename(imageUrl); // Extract filename (e.g., 'a1b2c3d4.jpg')
    const filePath = path.join(basePath, fileName);

    // Remove the image from the database
    property.images = property.images.filter((img) => img !== imageUrl);
    await property.save();

    // Delete the file from the filesystem
    try {
      await fs.access(filePath); // Check if file exists
      await fs.unlink(filePath); // Delete the file
    } catch (error) {
      console.warn(`File not found or could not be deleted: ${filePath}`, error);
      // Optional: Throw an error or log for debugging, but proceed since DB is updated
    }

    return { message: 'Image deleted successfully' };
  }

  async requestInquiry(id: string, inquiryData: { name: string; email: string; message: string }, user: any): Promise<void> {
    const property = await this.getPropertyByPropertyId(id);
    // Future: Create transaction lead, send notification
    // Example: await this.notificationService.send(property.ownerId.toString(), `Inquiry from ${inquiryData.email}: ${inquiryData.message}`);
  }

  async sendDealRequest(propertyId: string, dealData: { commissionRate: number; terms: string }, agentUser: any): Promise<void> {
    const property = await this.getPropertyByPropertyId(propertyId);
    if (!agentUser.roles.includes(RoleEnum.Agent)) throw new UnauthorizedException('Only agents can send deal requests');
    const limit = property.type === 'rent' ? 2 : 4;
    if (property.agents.length >= limit) throw new BadRequestException('Agent limit reached');
    property.agents.push({ agentId: agentUser.userId, commissionRate: dealData.commissionRate, terms: dealData.terms, status: agentUser.status, phone: agentUser.phone });
    await property.save();
    // Send notification to owner
    // Example: await this.notificationService.send(property.ownerId.toString(), `New deal request from agent ${agentUser.userId}`);
  }

  async acceptDeal(propertyId: string, agentId: string, ownerUser: any): Promise<void> {
    const property = await this.getPropertyByPropertyId(propertyId);
    if (property.ownerId.toString() !== ownerUser.userId) throw new UnauthorizedException('Only owners can accept deals');
    const agentIndex = property.agents.findIndex(a => a.agentId.toString() === agentId);
    if (agentIndex === -1) throw new NotFoundException('Agent not found in requests');
    property.agents[agentIndex].status = 'accepted';
    await property.save();
    // Update user connections, send notification
    // Example: await this.notificationService.send(agentId, 'Your deal request was accepted');
  }
}