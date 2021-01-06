import { CoreOutput } from 'src/common/dto/output.dto';
import { User } from 'src/users/entities/user.entity';
import { EntityRepository, Repository } from 'typeorm';
import { Dish } from '../entities/dish.entity';

@EntityRepository(Dish)
export class DishRepository extends Repository<Dish> {

  async isValid(owner: User, dishId: number): Promise<CoreOutput> {
    const dish = await this.findOne(dishId, {
      relations: ['restaurant'],
    });
    if (!dish) {
      return {
        ok: false,
        error: 'Dish not found'
      };
    }
    if (dish.restaurant.ownerId !== owner.id) {
      return {
        ok: false,
        error: 'You can\'t edit a dish that you don\'t own'
      };
    }
    return {
      ok: true,
    }
  }
}
