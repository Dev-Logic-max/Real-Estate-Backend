import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards, Request, Query, UploadedFiles, BadRequestException } from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Property')
@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) { }

  // POST /property - Create a new property (Users, admins)
  @Post()
  @ApiOperation({ summary: 'Create a new property', description: 'Allows Users to create properties.' })
  @ApiBearerAuth('access-token')
  @ApiCreatedResponse({ description: 'Property created successfully', type: CreatePropertyDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.User, RoleEnum.Admin)
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
    return this.propertyService.createProperty(createPropertyDto, req.user);
  }

  // PATCH /property/:id - Update property
  @Patch(':id')
  @ApiOperation({ summary: 'Update property', description: 'Allows owners or admins to update properties.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiOkResponse({ description: 'Property updated', type: UpdatePropertyDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.User, RoleEnum.Admin)
  update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto, @Request() req) {
    return this.propertyService.updateProperty(id, updatePropertyDto, req.user);
  }

  // PATCH /property/:id/status - Update property status (admins only)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update property status', description: 'Allows admins to update the status of a property.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiBody({ type: Object, schema: { properties: { status: { type: 'string', enum: ['active', 'inactive', 'pending', 'suspended'] } } } })
  @ApiOkResponse({ description: 'Property status updated' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin)
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: { status: string, purpose: string }, @Request() req) {
    return this.propertyService.updatePropertyStatusByAdmin(id, updateStatusDto, req.user);
  }

  // DELETE /property/:id - Delete property
  @Delete(':id')
  @ApiOperation({ summary: 'Delete property', description: 'Allows owners or admins to delete properties.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiOkResponse({ description: 'Property deleted' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin, RoleEnum.User)
  remove(@Param('id') id: string, @Request() req) {
    return this.propertyService.deleteProperty(id, req.user);
  }

  // GET /property - Get all & Search properties with filters
  @Get('all')
  @ApiOperation({ summary: 'Search properties', description: 'Retrieves paginated properties with filters.' })
  @ApiOkResponse({ description: 'Properties retrieved', schema: { properties: { properties: { type: 'array' }, total: { type: 'number' } } } })
  @UseGuards(JwtAuthGuard) // Optional: Restrict to authenticated users if needed
  findAll(@Query() searchDto: SearchPropertyDto) {
    return this.propertyService.getAllProperties(searchDto);
  }

  // GET /property/approved - Get approved (active) properties with filters
  @Get('approved')
  @ApiOperation({ summary: 'Get approved properties', description: 'Retrieves paginated properties with status "active" and optional filters.' })
  @ApiOkResponse({ description: 'Approved properties retrieved', schema: { properties: { properties: { type: 'array' }, total: { type: 'number' } } } })
  async getApprovedProperties(@Query() searchDto: SearchPropertyDto) {
    return this.propertyService.getApprovedProperties(searchDto);
  }

  // GET /property/user/:userId - Get properties by owner user ID
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get properties by owner user ID', description: 'Retrieves all properties owned by a specific user.' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiOkResponse({ description: 'Properties retrieved', schema: { properties: { properties: { type: 'array' }, total: { type: 'number' } } } })
  @UseGuards(JwtAuthGuard)
  async getPropertiesByUserId(@Param('userId') userId: string) {
    return this.propertyService.getPropertyByOwnerId(userId);
  }

  // GET /property/:id - Get property details
  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID', description: 'Retrieves a single property.' })
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiOkResponse({ description: 'Property found' })
  findOne(@Param('id') id: string) {
    return this.propertyService.getPropertyByPropertyId(id);
  }

  // POST /property/upload-property-images/:id - Upload property images
  @Post('upload-property-images/:id')
  @ApiOperation({ summary: 'Upload property image', description: 'Adds an image to the property.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiOkResponse({
    description: 'Array of image paths uploaded',
    schema: { type: 'array', items: { type: 'string' } }, // e.g., ["/property/a1b2c3d4.jpg", "/property/e5f6g7h8.png"]
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.User, RoleEnum.Admin) // Restrict to owners
  @UseInterceptors(FilesInterceptor('files', 12, { dest: './uploads/property' })) // Limit to 12 files
  async uploadImage(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    const paths = await this.propertyService.addImages(id, files, req.user);
    return { image: paths };
  }

  // DELETE /property/:propertyId/images/:imageUrl - Delete a property image
  @Delete(':propertyId/images/:imageUrl')
  @ApiOperation({ summary: 'Delete property image', description: 'Allows owners or admins to delete a specific image from a property.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: String })
  @ApiParam({ name: 'imageUrl', description: 'Image URL to delete', type: String })
  @ApiOkResponse({ description: 'Image deleted successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.User, RoleEnum.Admin)
  async removeImage(@Param('propertyId') propertyId: string, @Param('imageUrl') imageUrl: string, @Request() req) {
    await this.propertyService.removeImage(propertyId, imageUrl, req.user);
    return { propertyId, imageUrl, user: req.user, message: 'Image deleted successfully' };
  }

  // POST /property/:id/request - Submit inquiry
  @Post(':id/request')
  @ApiOperation({ summary: 'Submit property inquiry', description: 'Users submit interest in a property.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiBody({ type: Object, schema: { properties: { name: { type: 'string' }, email: { type: 'string' }, message: { type: 'string' } } } })
  @ApiOkResponse({ description: 'Inquiry sent' })
  @UseGuards(JwtAuthGuard)
  requestInquiry(@Param('id') id: string, @Body() inquiryData: { name: string; email: string; message: string }, @Request() req) {
    return this.propertyService.requestInquiry(id, inquiryData, req.user);
  }

  // POST /property/:id/deal-request - Agent sends deal request
  @Post(':id/deal-request')
  @ApiOperation({ summary: 'Send deal request to property', description: 'Agents propose terms to owners.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiBody({ type: Object, schema: { properties: { commissionRate: { type: 'number' }, terms: { type: 'string' } } } })
  @ApiOkResponse({ description: 'Deal request sent' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Agent)
  sendDealRequest(@Param('id') id: string, @Body() dealData: { commissionRate: number; terms: string }, @Request() req) {
    return this.propertyService.sendDealRequest(id, dealData, req.user);
  }

  // POST /property/:id/accept-deal - Owner accepts deal
  @Post(':id/accept-deal')
  @ApiOperation({ summary: 'Accept agent deal', description: 'Owners accept agent proposals.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiBody({ type: Object, schema: { properties: { agentId: { type: 'string' } } } })
  @ApiOkResponse({ description: 'Deal accepted' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.User)
  acceptDeal(@Param('id') id: string, @Body() body: { agentId: string }, @Request() req) {
    return this.propertyService.acceptDeal(id, body.agentId, req.user);
  }
}