import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Category } from './category.entity';

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

  @ManyToOne(type => Category, category => category.restaurants)
  @Field(type => Category)
  category: Category;

  // @Field(() => Boolean, { defaultValue: true })
  // @Column({ default: false })
  // @IsOptional()
  // @IsBoolean()
  // isVegan?: boolean;

  // @Field(() => String)
  // @Column()
  // @IsString()
  // owner: string;

  // @Field(() => String)
  // @Column()
  // @IsString()
  // category: string;
}
