import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { createRestaurantDTO } from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  @Query(returns => [Restaurant])
  restaurants(@Args('veganOnly') veganOnly: Boolean): Restaurant[] {
    return [];
  }

  @Mutation(returns => Boolean)
  createRestaurant(
    @Args() createRestaurantDTO: createRestaurantDTO
  ): Boolean {
    console.log(createRestaurantDTO);
    return true;
  }
}
