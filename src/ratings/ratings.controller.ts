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
import { RatingService } from "./ratings.service";
import { CreateRatingDto } from "./dto/create-rating.dto";
import { UpdateRatingDto } from "./dto/update-rating.dto";
import { Roles } from "src/common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@ApiTags("Ratings")
@Controller("ratings")
@UseGuards(RoleGuard, UserCategoryGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingService) {}

  @Post()
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Create a new rating" })
  create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingsService.create(createRatingDto);
  }

  @Get()
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Get all ratings" })
  findAll() {
    return this.ratingsService.findAll();
  }

  @Get(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Get rating by ID" })
  findOne(@Param("id") id: string) {
    return this.ratingsService.findOne(+id);
  }

  @Patch(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Update rating by ID" })
  update(@Param("id") id: string, @Body() updateRatingDto: UpdateRatingDto) {
    return this.ratingsService.update(+id, updateRatingDto);
  }

  @Delete(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Delete rating by ID" })
  remove(@Param("id") id: string) {
    return this.ratingsService.remove(+id);
  }
}
