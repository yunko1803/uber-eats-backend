import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/output.dto';
import { Order, OrderStatus } from '../entities/order.entity';

@InputType()
export class OrderUpdatesInput extends PickType(Order, ['id']) {}
