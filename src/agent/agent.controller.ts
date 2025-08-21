import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from 'src/users/users.service';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(
    private agentService: AgentService,
    private usersService: UsersService,
  ) {}

  // POST /agent/request - Request to become agent
  @Post('request')
  @ApiOperation({ summary: 'Request to become agent', description: 'Users request to become agents.' })
  @ApiBearerAuth('access-token')
  @ApiCreatedResponse({ description: 'Request sent', type: CreateAgentDto })
  @UseGuards(JwtAuthGuard)
  requestAgent(@Body() createAgentDto: CreateAgentDto, @Request() req) {
    return this.agentService.requestAgent(req.user.userId, createAgentDto);
  }

  // POST /agent/:id/approve - Approve agent request (admin)
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve agent request', description: 'Admins approve agent requests.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Agent request ID', type: String })
  @ApiOkResponse({ description: 'Agent approved' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin)
  approveAgent(@Param('id') id: string) {
    return this.agentService.approveAgent(id);
  }

  // POST /agent/:id/reject - Reject agent request (admin)
  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject agent request', description: 'Admins reject agent requests.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Agent request ID', type: String })
  @ApiOkResponse({ description: 'Agent rejected' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin)
  rejectAgent(@Param('id') id: string) {
    return this.agentService.rejectAgent(id);
  }

  // POST /agent/create - Create agent directly (admin)
  @Post('create')
  @ApiOperation({ summary: 'Create agent directly', description: 'Admins create an agent user directly with agent details.' })
  @ApiBearerAuth('access-token')
  @ApiCreatedResponse({ description: 'Agent created successfully', type: CreateAgentDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin)
  async createAgent(@Body() createAgentDto: CreateAgentDto, @Request() req) {
    return this.agentService.createAgent(req.user.userId, createAgentDto); // Use admin's userId or pass target userId
  }

  // GET /agent - Get approved agents
  @Get()
  @ApiOperation({ summary: 'Get all approved agents with user data', description: 'Retrieves a list of all approved agents along with their associated user data.' })
  @ApiOkResponse({ description: 'List of agents Agents with user data retrieved' })
  async getAllAgentsWithUserData() {
    return this.agentService.findAllWithUserData();
  }

  // GET /agent/requests - Get all pending agent requests (admin only)
  @Get('requests')
  @ApiOperation({ summary: 'Get all pending agent requests', description: 'Retrieves all pending agent requests for admin review.' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: 'Pending requests retrieved' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin)
  findPendingRequests() {
    return this.agentService.findPendingRequests();
  }

  // GET /agent/:id - Get agent details
  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID', description: 'Retrieves a single agent.' })
  @ApiParam({ name: 'id', description: 'Agent ID', type: String })
  @ApiOkResponse({ description: 'Agent found' })
  findOne(@Param('id') id: string) {
    return this.agentService.findOne(id);
  }

  // PATCH /agent/:id - Update agent
  @Patch(':id')
  @ApiOperation({ summary: 'Update agent', description: 'Allows admins or agents to update.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Agent ID', type: String })
  @ApiOkResponse({ description: 'Agent updated', type: UpdateAgentDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin, RoleEnum.Agent)
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentService.update(id, updateAgentDto);
  }

  // DELETE /agent/:id - Delete agent
  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent', description: 'Admins delete agents.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Agent ID', type: String })
  @ApiOkResponse({ description: 'Agent deleted' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin)
  remove(@Param('id') id: string) {
    return this.agentService.remove(id);
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Get user and agent data by user ID',
    description: 'Retrieves user details and corresponding agent data (if exists) for the given user ID.'
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiOkResponse({
    description: 'User and agent data retrieved',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: '#/components/schemas/User' },
        agent: { $ref: '#/components/schemas/Agent' },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  async getUserWithAgent(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const agent = await this.agentService.findByUserId(userId);
    return { user, agent };
  }
}