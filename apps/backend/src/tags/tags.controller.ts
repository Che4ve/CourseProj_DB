import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@ApiTags('tags')
@Controller('tags')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  async findAll(@Request() req): Promise<any> {
    return this.tagsService.findAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  async create(@Body() dto: CreateTagDto, @Request() req) {
    return this.tagsService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tag' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTagDto, @Request() req) {
    return this.tagsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tag' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.tagsService.delete(id, req.user.id);
  }

  @Post(':id/habits/:habitId')
  @ApiOperation({ summary: 'Attach tag to habit' })
  async attachToHabit(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Request() req,
  ) {
    return this.tagsService.attachTagToHabit(id, habitId, req.user.id);
  }

  @Delete(':id/habits/:habitId')
  @ApiOperation({ summary: 'Detach tag from habit' })
  async detachFromHabit(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Request() req,
  ) {
    return this.tagsService.detachTagFromHabit(id, habitId, req.user.id);
  }
}
