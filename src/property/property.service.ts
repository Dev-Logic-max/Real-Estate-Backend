import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';
import { RoleEnum } from 'src/common/enums/role.enum';
import { UploadService } from 'src/uploads/upload.service';

@Injectable()
export class PropertyService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    private uploadService: UploadService, // Inject UploadService
  ) { }

  async create(createPropertyDto: CreatePropertyDto, user: any): Promise<PropertyDocument> {
    if (!user.roles.includes(RoleEnum.Seller) && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('Only sellers, or admins can create properties');
    }
    const newProperty = new this.propertyModel({
      ...createPropertyDto,
      ownerId: user.userId,
      agents: [], // Initialize agents array
    });
    return newProperty.save();
  }

  async findAll(searchDto: SearchPropertyDto): Promise<{ properties: PropertyDocument[]; total: number }> {
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

  async findOne(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).exec();
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, user: any): Promise<PropertyDocument> {
    const property = await this.findOne(id);
    if (property.ownerId.toString() !== user.userId && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('You can only update your own properties');
    }
    const updated = await this.propertyModel.findByIdAndUpdate(id, updatePropertyDto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Update failed');
    return updated;
  }

  async remove(id: string, user: any): Promise<void> {
    const property = await this.findOne(id);
    if (property.ownerId.toString() !== user.userId && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('You can only delete your own properties');
    }
    await this.propertyModel.deleteOne({ _id: id });
  }

  async addImages(id: string, files: Express.Multer.File[], user: any): Promise<string[]> {
    const property = await this.findOne(id);
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

  async requestInquiry(id: string, inquiryData: { name: string; email: string; message: string }, user: any): Promise<void> {
    const property = await this.findOne(id);
    // Future: Create transaction lead, send notification
    // Example: await this.notificationService.send(property.ownerId.toString(), `Inquiry from ${inquiryData.email}: ${inquiryData.message}`);
  }

  async sendDealRequest(propertyId: string, dealData: { commissionRate: number; terms: string }, agentUser: any): Promise<void> {
    const property = await this.findOne(propertyId);
    if (!agentUser.roles.includes(RoleEnum.Agent)) throw new UnauthorizedException('Only agents can send deal requests');
    const limit = property.type === 'rent' ? 2 : 4;
    if (property.agents.length >= limit) throw new BadRequestException('Agent limit reached');
    property.agents.push({ agentId: agentUser.userId, commissionRate: dealData.commissionRate, terms: dealData.terms, status: 'pending' });
    await property.save();
    // Send notification to owner
    // Example: await this.notificationService.send(property.ownerId.toString(), `New deal request from agent ${agentUser.userId}`);
  }

  async acceptDeal(propertyId: string, agentId: string, ownerUser: any): Promise<void> {
    const property = await this.findOne(propertyId);
    if (property.ownerId.toString() !== ownerUser.userId) throw new UnauthorizedException('Only owners can accept deals');
    const agentIndex = property.agents.findIndex(a => a.agentId.toString() === agentId);
    if (agentIndex === -1) throw new NotFoundException('Agent not found in requests');
    property.agents[agentIndex].status = 'accepted';
    await property.save();
    // Update user connections, send notification
    // Example: await this.notificationService.send(agentId, 'Your deal request was accepted');
  }
}