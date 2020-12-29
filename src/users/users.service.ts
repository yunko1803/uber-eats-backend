import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>
  ) {}

  async createAccount({ email, password, role }: CreateAccountInput): Promise<CreateAccountOutput> {
    // check new user
    // create user & hash the password
    // ok
    try {
      const exist = await this.users.findOne({ email });
      if (exist) {
        return {
          ok: false,
          error: 'User Already Exists'
        };
      }
      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch(e) {
      return {
        ok: false,
        error: 'Couldn\'t create account'
      };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({ email });
      if (!user) {
        return {
          ok: false,
          error: 'User Not Found'
        };
      }
      const isCorrectPassword = await user.checkPassword(password);

      if(!isCorrectPassword) {
        return {
          ok: false,
          error: 'Wrong Password'
        };
      }

      return {
        ok: true,
        token: 'lalala'
      };

    } catch(error) {
      return {
        ok: false,
        error,
      };
    }

  }
}
