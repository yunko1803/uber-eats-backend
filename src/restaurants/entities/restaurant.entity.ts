import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Category } from './category.entity';
import { User } from 'src/users/entities/user.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Field(type => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;


  @Field(type => String)
  @Column()
  @IsString()
  address: string;

  @Field(type => String)
  @Column()
  @IsString()
  bgImage: string;

  @Field(type => Category, { nullable: true })
  @ManyToOne(type => Category, category => category.restaurants, { nullable: true, onDelete: 'SET NULL' })
  category: Category;

  @Field(type => User)
  @ManyToOne(type => User, user => user.restaurants)
  owner: User;

  // @Field(() => Boolean, { defaultValue: true })
  // @Column({ default: false })
  // @IsOptional()
  // @IsBoolean()
  // isVegan?: boolean;


  // @Field(() => String)
  // @Column()
  // @IsString()
  // category: string;
}
