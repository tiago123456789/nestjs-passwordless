import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { User } from './user.entity';
import { createHash, pbkdf2Sync, randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private readonly repository: MongoRepository<User>,
    private readonly mailService: MailerService,
    private readonly jwtService: JwtService,
  ) {}

  save(data: User) {
    return this.repository.save(data);
  }

  async login(email: string) {
    const userByEmail: User = await this.repository.findOne({ email });

    if (!userByEmail) {
      throw new HttpException('Check if you typed correct email', 400);
    }

    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(
      userByEmail._id + new Date().getTime(),
      salt,
      1000,
      64,
      `sha512`,
    ).toString(`hex`);

    const dateExpirationHash = new Date();
    dateExpirationHash.setMinutes(dateExpirationHash.getMinutes() + 15);

    userByEmail.hash = hash;
    userByEmail.dateExpirationHash = dateExpirationHash;

    return Promise.all([
      this.repository.update({ _id: userByEmail._id }, userByEmail),
      this.mailService.sendMail({
        to: email,
        subject: 'Authenticate using passwordless',
        html: `Hi, ${userByEmail.name} <a href="http://localhost:3000/token/${hash}">click here</a> to authenticate`,
      }),
    ]);
  }

  async generateAccessTokenByHash(hash: string) {
    const userByHash: User = await this.repository.findOne({ hash });

    if (!userByHash) {
      throw new HttpException('Link invalid! Try login again', 400);
    }

    if (userByHash.dateExpirationHash <= new Date()) {
      throw new HttpException('Link invalid! Try login again', 400);
    }

    await this.repository.update(
      { _id: userByHash._id },
      { hash: null, dateExpirationHash: null },
    );
    return this.jwtService.sign({
      name: userByHash.name,
      email: userByHash.email,
    });
  }
}
