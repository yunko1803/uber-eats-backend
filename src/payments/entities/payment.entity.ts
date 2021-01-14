import { ObjectType, Field, InputType, registerEnumType, Float, Int } from '@nestjs/graphql';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { IsEnum, IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Field(type => Int)
  @Column()
  transactionId: number;

  @Field(type => User)
  @ManyToOne(type => User, user => user.payments)
  user: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  @Field(type => Restaurant)
  @ManyToOne(type => Restaurant)
  restaurant: Restaurant;

  @Field(type => Int)
  @RelationId((payment: Payment) => payment.restaurant)
  restaurantId: number;
}
