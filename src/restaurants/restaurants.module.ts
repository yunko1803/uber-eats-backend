import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryResolver, DishResolver, RestaurantResolver } from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';
import { CategoryRepository } from './repositories/category.repository';
import { RestaurantRepository } from './repositories/restaurant.repository';
import { Dish } from './entities/dish.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RestaurantRepository, CategoryRepository, Dish])],
  providers: [RestaurantResolver, RestaurantService, CategoryResolver, DishResolver],
})

export class RestaurantsModule {}
