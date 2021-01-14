import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/output.dto';
import { Payment } from '../entities/payment.entity';

@ObjectType()
export class GetPaymentsOutput extends CoreOutput {
  @Field(type => [Payment], { nullable: true })
  payments?: Payment[];
}