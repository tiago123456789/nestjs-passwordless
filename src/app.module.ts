import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.MONGODB_URL,
      entities: [join(__dirname, '**/**.entity{.ts,.js}')],
      synchronize: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([User]),
    MailerModule.forRootAsync({
      useFactory(configService: ConfigService) {
        return {
          transport: {
            host: configService.get('MAIL_HOST'),
            port: configService.get('MAIL_PORT'),
            auth: {
              user: configService.get('MAIL_USER'),
              pass: configService.get('MAIL_PASSWORD'),
            },
          },
          defaults: {
            from: '"noreply" <noreply@companyteste.com>',
          },
        };
      },
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get('JWT_SECRET'),
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
