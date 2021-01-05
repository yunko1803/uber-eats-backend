import { CoreOutput } from "src/common/dto/output.dto";
import { User } from "src/users/entities/user.entity";
import { EntityRepository, Repository } from "typeorm";
import { Restaurant } from "../entities/restaurant.entity";

@EntityRepository(Restaurant)
export class RestaurantRepository extends Repository<Restaurant> {

  async isValid(owner: User, restaurantId: number): Promise<CoreOutput> {
    const restaurant = await this.findOne(
      restaurantId, {
        loadRelationIds: true
      }
    );

    if (!restaurant) {
      return {
        ok: false,
        error: 'Restaurant not found'
      };
    }

    if (owner.id !== restaurant.ownerId) {
      return {
        ok: false,
        error: 'You can\'t edit a restaurant that you don\'t own'
      };
    }

    return {
      ok: true,
    }
  }
}
