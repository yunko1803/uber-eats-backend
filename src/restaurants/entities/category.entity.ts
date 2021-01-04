import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, OneToMany } from 'typeorm';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from './restaurant.entity';

@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Field(type => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field(type => String)
  @Column()
  @IsString()
  coverImage: string;

  @OneToMany(type => Restaurant, restaurant => restaurant.category)
  @Field(type => [Restaurant])
  restaurants: Restaurant[];
}
