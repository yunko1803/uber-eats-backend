import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/output.dto';
import { Order, OrderStatus } from '../entities/order.entity';

@InputType()
export class GetOrderInput extends PickType(Order, ['id']) {}

@ObjectType()
export class GetOrderOutput extends CoreOutput {
  @Field(type => Order, { nullable: true })
  order?: Order;
}
