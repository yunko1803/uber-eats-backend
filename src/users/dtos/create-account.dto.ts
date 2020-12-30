import { ObjectType, PickType, InputType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class CreateAccountInput extends PickType(User, ["email", "password", "role"]) {}

@ObjectType()
export class CreateAccountOutput extends CoreOutput{}
