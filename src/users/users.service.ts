import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({ email, password, role }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return {
          ok: false,
          error: 'User Already Exists'
        };
      }
      const user = await this.users.save(this.users.create({ email, password, role }));
      const verification = await this.verifications.save(this.verifications.create({
        user
      }));
      this.mailService.sendVerificationEmail(user.email, verification.code);
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
        error: 'Couldn\'t log in',
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'User Not Found',
      };
    }
  }

  async editProfile(userId: number, { email, password }: EditProfileInput): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne(userId);
      if (email) {
        user.email = email;
        user.verified = false;
        const verification = await this.verifications.save(this.verifications.create({ user }));
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not update profile.'
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      // only brings the relation id
      // const verification = await this.verifications.findOne({ code }, { loadRelationIds: true });
      // brings whole relation data
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] });
      if (verification) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        await this.verifications.delete(verification.id);
        return { ok: true };
      }
      return {
        ok: false,
        error: 'Verification Not Found'
      };
    } catch(error) {
      return {
        ok: false,
        error: 'Could Not Verify',
      };
    }
  }
}
