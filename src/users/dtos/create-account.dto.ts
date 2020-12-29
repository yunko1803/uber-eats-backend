import { ObjectType, PickType, Field, InputType } from "@nestjs/graphql";
import { MutationOutput } from "src/common/dto/output.dto";
import { StringLiteralLike } from "typescript";
import { User } from "../entities/user.entity";

@InputType()
export class CreateAccountInput extends PickType(User, ["email", "password", "role"]) {}

@ObjectType()
export class CreateAccountOutput extends MutationOutput{}
