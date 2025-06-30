import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClientSession } from "./entities/client-session.entity";
import { CreateClientSessionDto } from "./dto/create-client-session.dto";
import { Client } from "../client/entities/client.entity";

@Injectable()
export class ClientSessionService {
  constructor(
    @InjectRepository(ClientSession)
    private readonly sessions: Repository<ClientSession>,

    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>
  ) {}

  async create(dto: CreateClientSessionDto): Promise<ClientSession> {
    const {
      client_id,
      refresh_token, // already hashed!
      device_id,
      device_type,
      fcm_token,
      is_active,
      expires_at,
    } = dto;

    // 1. Check if client exists
    const client = await this.clientsRepository.findOne({
      where: { id: client_id },
    });
    if (!client) {
      throw new BadRequestException("Client not found");
    }

    // 2. Create new session entity
    const session = this.sessions.create({
      client,
      refresh_token, // hashed value passed from calling service
      device_id,
      device_type,
      fcm_token,
      is_active: is_active ?? true,
      expires_at,
      created_at: new Date(),
    });

    // 3. Save session
    return await this.sessions.save(session);
  }

  async findAll(): Promise<ClientSession[]> {
    return this.sessions.find();
  }

  async findOne(id: number): Promise<ClientSession> {
    const session = await this.sessions.findOne({ where: { id } });
    if (!session) {
      throw new BadRequestException(`Session with ID ${id} not found`);
    }
    return session;
  }

  async update(
    id: number,
    dto: Partial<ClientSession>
  ): Promise<ClientSession> {
    const existing = await this.findOne(id);
    const updated = this.sessions.merge(existing, dto);
    return this.sessions.save(updated);
  }

  async remove(id: number): Promise<void> {
    const session = await this.findOne(id);
    await this.sessions.remove(session);
  }
}
