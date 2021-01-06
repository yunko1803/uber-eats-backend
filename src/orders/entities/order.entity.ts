import { ObjectType, Field, InputType, registerEnumType, Float } from '@nestjs/graphql';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';

enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered'
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Field(type => User, { nullable: true })
  @ManyToOne(type => User, user => user.orders, { onDelete: 'SET NULL', nullable: true })
  customer?: User;

  @Field(type => User, { nullable: true })
  @ManyToOne(type => User, user => user.rides, { onDelete: 'SET NULL', nullable: true })
  driver: User;

  @Field(type => Restaurant)
  @ManyToOne(type => Restaurant, restaurant => restaurant.orders, { onDelete: 'SET NULL', nullable: true })
  restaurant: Restaurant;

  @Field(type => [Dish])
  @ManyToMany(type => Dish)
  @JoinTable()
  dishes: Dish[];

  @Column()
  @Field(type => Float)
  total: number;

  @Field(type => OrderStatus)
  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;
}
