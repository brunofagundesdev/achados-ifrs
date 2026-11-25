import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { Papel } from '../generated/prisma/client.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { TagsService } from './tags.service.js';

@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.tags.create(dto);
  }

  @Get()
  findAll() {
    return this.tags.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tags.findOne(id);
  }

  @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
    return this.tags.update(id, dto);
  }

  @Roles(Papel.RESPONSAVEL, Papel.ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tags.remove(id);
  }
}
