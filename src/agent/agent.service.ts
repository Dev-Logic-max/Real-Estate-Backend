import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from './schemas/agent.schema';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from 'src/users/users.service';
import { RoleEnum } from 'src/common/enums/role.enum';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class AgentService {
  constructor(
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
    private usersService: UsersService,
    private notificationService: NotificationService,
  ) { }

  async requestAgent(userId: string, agentData: CreateAgentDto): Promise<AgentDocument> {
    const existing = await this.agentModel.findOne({ userId });
    if (existing) throw new BadRequestException('Request already pending');
    const newRequest = new this.agentModel({
      userId,
      ...agentData,
      status: 'pending',
    });
    return newRequest.save();
  }

  async approveAgent(id: string): Promise<AgentDocument> {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) throw new NotFoundException('Agent request not found');
    agent.status = 'approved';
    agent.license = uuidv4().replace(/-/g, ''); // Generate license
    // return agent.save();
    await agent.save();
    // Update user role to include Agent, send notification

    // Update user role to include Agent
    const user = await this.usersService.findById(agent.userId.toString());
    if (!user?.roles.includes(RoleEnum.Agent)) {
      user?.roles.push(RoleEnum.Agent);
      await user?.save();
    }

    // Send notification (example)
    await this.notificationService.send({
      userId: agent.userId.toString(),
      message: `Your agent request has been approved. License: ${agent.license}`,
      type: 'in-app',
      allowedRoles: [RoleEnum.Agent],
      purpose: 'agent_approved',
      relatedId: agent._id?.toString(),
      relatedModel: 'Agent',
    });
    
    return agent;
  }

  async rejectAgent(id: string): Promise<AgentDocument> {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) throw new NotFoundException('Agent request not found');
    agent.status = 'rejected';
    await agent.save();

    // Send notification
    await this.notificationService.send({
      userId: agent.userId.toString(),
      message: 'Your agent request has been rejected.',
      type: 'in-app',
      allowedRoles: [RoleEnum.User],
      purpose: 'agent_rejected',
      relatedId: agent._id?.toString(),
      relatedModel: 'Agent',
    });

    return agent;
  }

  async create(createAgentDto: CreateAgentDto, userId: string): Promise<AgentDocument> {
    return this.requestAgent(userId, createAgentDto);
  }

  async createAgent(userId: string, createAgentDto: CreateAgentDto): Promise<AgentDocument> {
    // Check if user exists
    await this.usersService.findById(userId);
    const existingAgent = await this.agentModel.findOne({ userId }).exec();
    if (existingAgent) throw new BadRequestException('Agent already exists for this user');

    const agent = new this.agentModel({
      userId,
      ...createAgentDto,
      status: 'approved', // Directly approved by admin
      license: uuidv4().replace(/-/g, ''),
    });
    const savedAgent = await agent.save();

    // Update user role to Agent
    const user = await this.usersService.findById(userId);
    if (!user?.roles.includes(RoleEnum.Agent)) {
      user?.roles.push(RoleEnum.Agent);
      await user?.save();
    }
    return savedAgent;
  }

  async findAllWithUserData(): Promise<{ agent: AgentDocument; user: any }[]> {
    const agents = await this.agentModel.find({ status: 'approved' }).exec();
    const result = await Promise.all(
      agents.map(async (agent) => {
        const user = await this.usersService.findById(agent.userId.toString());
        return { agent, user };
      }),
    );
    return result;
  }

  async findPendingRequests(): Promise<AgentDocument[]> {
    return this.agentModel.find({ status: 'pending' }).exec();
  }

  async findOne(id: string): Promise<AgentDocument> {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async findByUserId(userId: string): Promise<AgentDocument | null> {
    return this.agentModel.findOne({ userId }).exec();
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<AgentDocument> {
    const updated = await this.agentModel.findByIdAndUpdate(id, updateAgentDto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Update failed');
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.agentModel.deleteOne({ _id: id });
  }

  async creditCommission(agentId: string, amount: number): Promise<AgentDocument> {
    const agent = await this.findOne(agentId);
    agent.balance += amount;
    return agent.save();
  }
}