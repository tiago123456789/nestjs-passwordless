import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { AppService } from './app.service';
import { User } from './user.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/register')
  @HttpCode(201)
  register(@Body() data: User) {
    return this.appService.save(data);
  }

  @Post('/login')
  @HttpCode(204)
  login(@Body() data: User) {
    return this.appService.login(data.email);
  }

  @Get('/token/:hash')
  async generateAccessTokenByHash(@Param('hash') hash: string) {
    const accessToken = await this.appService.generateAccessTokenByHash(hash);
    return {
      accessToken,
    };
  }
}
