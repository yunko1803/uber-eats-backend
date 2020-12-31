import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({ email, password, role }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exist = await this.users.findOne({ email });
      if (exist) {
        return {
          ok: false,
          error: 'User Already Exists'
        };
      }
      const user = await this.users.save(this.users.create({ email, password, role }));
      await this.verifications.save(this.verifications.create({
        user
      }));
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
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] }
      );
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
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };

    } catch(error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async findById(id: number): Promise<User> {
    return this.users.findOne({ id });
  }

  async editProfile(userId: number, { email, password }: EditProfileInput): Promise<User> {
    const user = await this.users.findOne(userId);
    if (email) {
      user.email = email;
      user.verified = false;
      await this.verifications.save(this.verifications.create({ user }));
    }

    if (password) {
      user.password = password;
    }
    return this.users.save(user);
  }

  async verifyEmail(code: string): Promise<boolean> {

    try {
      // only brings the relation id
      // const verification = await this.verifications.findOne({ code }, { loadRelationIds: true });
      // brings whole relation data
      const verification = await this.verifications.findOne({ code }, { relations: ['user'] });
      console.log(verification);
      if (verification) {
        verification.user.verified = true;
        this.users.save(verification.user);
        return true;
      }

      throw new Error();
    } catch(error) {
      console.log(error);
      return false;
    }

  }
}
