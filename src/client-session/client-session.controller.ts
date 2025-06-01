import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ClientSessionService } from "./client-session.service";
import { CreateClientSessionDto } from "./dto/create-client-session.dto";
import { UpdateClientSessionDto } from "./dto/update-client-session.dto";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { Roles } from "../common/decorators/role.decorator";

@ApiTags("Client Sessions")
@ApiBearerAuth()
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles( "client") // Enforcing client-only access
@Controller("client-session")
export class ClientSessionController {
  constructor(private readonly clientSessionService: ClientSessionService) {}

  @Post()
  @ApiOperation({ summary: "Create a new client session" })
  @ApiResponse({ status: 201, description: "Client session created" })
  create(@Body() createClientSessionDto: CreateClientSessionDto) {
    return this.clientSessionService.create(createClientSessionDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all client sessions" })
  @ApiResponse({ status: 200, description: "List of client sessions" })
  findAll() {
    return this.clientSessionService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a client session by ID" })
  @ApiResponse({ status: 200, description: "Client session details" })
  findOne(@Param("id") id: string) {
    return this.clientSessionService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a client session by ID" })
  @ApiResponse({ status: 200, description: "Client session updated" })
  update(
    @Param("id") id: string,
    @Body() updateClientSessionDto: UpdateClientSessionDto
  ) {
    return this.clientSessionService.update(+id, updateClientSessionDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a client session by ID" })
  @ApiResponse({ status: 200, description: "Client session deleted" })
  remove(@Param("id") id: string) {
    return this.clientSessionService.remove(+id);
  }
}
