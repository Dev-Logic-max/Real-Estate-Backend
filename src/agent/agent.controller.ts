import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) { }

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
  @ApiOperation({ summary: 'Get all approved agents', description: 'Retrieves approved agents.' })
  @ApiOkResponse({ description: 'Agents retrieved' })
  findAll() {
    return this.agentService.findAll();
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
}