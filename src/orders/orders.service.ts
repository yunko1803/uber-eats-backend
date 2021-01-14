import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { RestaurantRepository } from 'src/restaurants/repositories/restaurant.repository';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';


@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly restaurants: RestaurantRepository,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}

  canSeeOrder(user: User, order: Order): boolean {
    let canSee = true;
    if (user.role === UserRole.Client && order.customerId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      canSee = false;
    }
    if (
      user.role === UserRole.Owner &&
      order.restaurant.ownerId !== user.id
    ) {
      canSee = false;
    }
    return canSee;
  }

  async createOrder(customer: User, { restaurantId, items }: CreateOrderInput): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found'
        };
      }

      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return {
            ok: false,
            error: 'Dish not found'
          }
        }
        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(dishOption => dishOption.name === itemOption.name);
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices.find(dishOptionChoice => dishOptionChoice.name === itemOption.choice);
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice += dishOptionChoice.extra;
                }
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
        }));
        orderItems.push(orderItem);
      };
      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
      await this.pubsub.publish(NEW_PENDING_ORDER, { pendingOrders: { order, ownerId: restaurant.ownerId } });
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create order'
      };
    }
  }

  async getOrders(user: User, { status }: GetOrdersInput): Promise<GetOrdersOutput> {
    try {
      console.log(user);
      let orders: Order[];
      switch(user.role) {
        case UserRole.Client: {
          orders = await this.orders.find({
            where: {
              customer: user,
              ...(status && { status })
            }
          });
          break;
        }

        case UserRole.Delivery: {
          orders = await this.orders.find({
            where: {
              driver: user,
              ...(status && { status })
            }
          });
          break;
        }

        case UserRole.Owner: {
          const restaurants = await this.restaurants.find({
            where: {
              owner: user,
            },
            relations: ['orders']
          });
          orders = restaurants.map(restaurant => restaurant.orders).flat(1);
          if (status) {
            orders = orders.filter(order => order.status === status);
          }
        }
      }

      return {
        ok: true,
        orders
      };
    } catch (error) {
      console.log(error);
      return {
        ok: false,
        error: "Could not get orders"
      }
    }
  }

  async getOrder(user: User, { id: orderId }: GetOrderInput): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, { relations: ['restaurant'] });
      if (!order) {
        return {
          ok: false,
          error: 'Order not found'
        };
      }

      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: 'You could not see orders'
        };
      }

      return {
        ok: true,
        order
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not find order'
      };
    }
  }

  async editOrder(user: User, { id: orderId, status }: EditOrderInput): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, { relations: ['restaurant', 'customer', 'driver'] });
      if (!order) {
        return {
          ok: false,
          error: 'Order not found'
        };
      }

      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: 'You could not see orders'
        };
      }

      let canEdit = true;

      if (user.role === UserRole.Client) {
        canEdit = false;
      }

      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          canEdit = false;
        }
      }

      if (user.role === UserRole.Delivery) {
        if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered) {
          canEdit = false;
        }
      }

      if (!canEdit) {
        return {
          ok: false,
          error: 'You cannot edit the order status',
        };
      }

      await this.orders.save({
        id: orderId,
        status,
      });

      const newOrder = { ...order, status };

      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Cooked) {
          await this.pubsub.publish(NEW_COOKED_ORDER, { cookedOrders: newOrder });
        }
      }

      await this.pubsub.publish(NEW_ORDER_UPDATE, { orderUpdates: newOrder });
      return {
        ok: true,
      };

    } catch (error) {
      return {
        ok: false,
        error: 'Could not edit order'
      };
    }
  }
}
