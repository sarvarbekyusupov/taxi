import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DailyStatsService } from './daily-stats.service';
import { UpdateDailyStatDto } from './dto/update-daily-stat.dto';
import { CreateDailyStatsDto } from './dto/create-daily-stat.dto';

@Controller('daily-stats')
export class DailyStatsController {
  constructor(private readonly dailyStatsService: DailyStatsService) {}

  @Post()
  create(@Body() createDailyStatDto: CreateDailyStatsDto) {
    return this.dailyStatsService.create(createDailyStatDto);
  }

  @Get()
  findAll() {
    return this.dailyStatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dailyStatsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDailyStatDto: UpdateDailyStatDto) {
    return this.dailyStatsService.update(+id, updateDailyStatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dailyStatsService.remove(+id);
  }
}
