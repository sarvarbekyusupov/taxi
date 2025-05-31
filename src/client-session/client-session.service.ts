import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClientSession } from "./entities/client-session.entity";
import { CreateClientSessionDto } from "./dto/create-client-session.dto";
import { UpdateClientSessionDto } from "./dto/update-client-session.dto";
import { Client } from "../client/entities/client.entity";

@Injectable()
export class ClientSessionService {
  constructor(
    @InjectRepository(ClientSession)
    private readonly sessions: Repository<ClientSession>,

    @InjectRepository(Client)
    private clientsRepository: Repository<Client>
  ) {}

  async create(createDto: CreateClientSessionDto): Promise<ClientSession> {
    const {
      client_id,
      refresh_token,
      device_id,
      device_type,
      fcm_token,
      is_active,
      expires_at,
    } = createDto;

    const client = await this.clientsRepository.findOne({
      where: { id: client_id },
    });
    if (!client) {
      throw new BadRequestException("Client not found");
    }

    const session = this.sessions.create({
      client,
      refresh_token,
      device_id,
      device_type,
      fcm_token,
      is_active: is_active ?? true,
      expires_at,
      created_at: new Date(),
    });

    return this.sessions.save(session);
  }

  async findAll(): Promise<ClientSession[]> {
    return this.sessions.find();
  }

  async findOne(id: number): Promise<ClientSession> {
    const session = await this.sessions.findOne({ where: { id } });
    if (!session) throw new NotFoundException(`Session #${id} not found`);
    return session;
  }

  async update(
    id: number,
    updateDto: UpdateClientSessionDto
  ): Promise<ClientSession> {
    const session = await this.sessions.preload({ id, ...updateDto });
    if (!session) throw new NotFoundException(`Session #${id} not found`);
    return this.sessions.save(session);
  }

  async remove(id: number): Promise<void> {
    const session = await this.findOne(id);
    await this.sessions.remove(session);
  }
}
