import { Inject } from '@nestjs/common';
import { Args, Mutation, Resolver, Query, ResolveField, Int, Parent, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { PUB_SUB } from 'src/common/common.constants';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './orders.service';

@Resolver(of => Order)
export class OrderResolver {
  constructor(
    private readonly ordersService: OrderService,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}

  @Mutation(returns => CreateOrderOutput)
  @Role(['Client'])
  createOrder(@AuthUser() customer: User, @Args('input') createOrderInput: CreateOrderInput): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  @Query(returns => GetOrdersOutput)
  @Role(['Any'])
  getOrders(@AuthUser() user: User, @Args('input') getOrdersInput: GetOrdersInput): Promise<GetOrdersOutput> {
    return this.ordersService.getOrders(user, getOrdersInput);
  }

  @Query(returns => GetOrderOutput)
  @Role(['Any'])
  getOrder(@AuthUser() user: User, @Args('input') getOrderInput: GetOrderInput): Promise<GetOrderOutput> {
    return this.ordersService.getOrder(user, getOrderInput);
  }

  @Mutation(returns => EditOrderOutput)
  @Role(['Any'])
  editOrder(@AuthUser() user: User, @Args('input') editOrderInput: EditOrderInput): Promise<EditOrderOutput> {
    return this.ordersService.editOrder(user, editOrderInput);
  }

  @Mutation(returns => Boolean)
  async potatoReady(@Args('id') id: number) {
    await this.pubsub.publish('yoon', { orderSubscription: id });
    return true;
  }

  @Subscription(returns => String, {
    filter: (payload, variables, context) => {
      return payload.orderSubscription === variables.id;
    },
    resolve: (payload) => `Your id: ${payload.orderSubscription} is ready.`
  })
  @Role(['Any'])
  orderSubscription(@Args('id') id: number) {
    return this.pubsub.asyncIterator('yoon');
  }
}
