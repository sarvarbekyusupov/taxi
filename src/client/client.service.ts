import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client } from "./entities/client.entity";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clients: Repository<Client>
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clients.create(createClientDto);
    return await this.clients.save(client);
  }

  async findAll(): Promise<Client[]> {
    return await this.clients.find();
  }

  async findOne(id: number) {
    return await this.clients.findOneBy({ id });
  }

  async update(id: number, updateClientDto: UpdateClientDto): Promise<void> {
    await this.clients.update({ id }, updateClientDto);
  }

  async remove(id: number): Promise<void> {
    await this.clients.delete(id);
  }
}
