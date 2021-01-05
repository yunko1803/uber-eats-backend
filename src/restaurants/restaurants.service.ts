import { Injectable } from '@nestjs/common';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import { DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { RestaurantRepository } from './repositories/restaurant.repository';

@Injectable()
export class RestaurantService {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly categories: CategoryRepository,
  ) {}

  async createRestaurant(owner: User, createRestaurantInput: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(createRestaurantInput.categoryName);
      newRestaurant.category = category;

      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch(error) {
      return {
        ok: false,
        error: 'Could not create restaurant'
      };
    }
  }

  async editRestaurant(owner: User, editRestaurantInput: EditRestaurantInput): Promise<EditRestaurantOutput> {
    try {
      const isValid = await this.restaurants.isValid(owner, editRestaurantInput.restaurantId);
      if (!isValid.ok) {
        return isValid;
      }

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(editRestaurantInput.categoryName);
      }

      await this.restaurants.save([{
        id: editRestaurantInput.restaurantId,
        ...editRestaurantInput,
        ...(category && ({ category })),
      }]);

      return {
        ok: true,
      };

    } catch (error) {

      return {
        ok: false,
        error: 'Could not edit restaurant'
      };
    }
  }

  async deleteRestaurant(owner, restaurantId: number): Promise<DeleteRestaurantOutput> {
    try {
      const isValid = await this.restaurants.isValid(owner, restaurantId);
      if (!isValid.ok) {
        return isValid;
      }

      await this.restaurants.delete(restaurantId);
      console.log(`Restaurant with id ${restaurantId} is deleted.`);
      return {
        ok: true,
      }
    } catch (error) {
      return {
        ok: false,
        error: 'Could not delete'
      }
    }
  }
}
