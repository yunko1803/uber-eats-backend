import { ILike, Like, Raw, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import { DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { RestaurantRepository } from './repositories/restaurant.repository';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { SearchRestaurantInput, SearchRestaurantOutput } from './dtos/search-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { DishRepository } from './repositories/dish.repository';

@Injectable()
export class RestaurantService {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly categories: CategoryRepository,
    private readonly dishes: DishRepository,
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
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not delete'
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load categories'
      };
    }
  }

  countRestaurants(category: Category): Promise<number> {
    return this.restaurants.count({ category });
  }

  async findCategoryBySlug({ slug, page }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug });

      if (!category) {
        return {
          ok: false,
          error: 'Category not found'
        };
      }
      const restaurants = await this.restaurants.find({
        where: {
          category,
        },
        order: {
          isPromoted: 'DESC'
        },
        take: 25,
        skip: (page - 1) * 25,
      });
      const totalResults = await this.countRestaurants(category)
      return {
        ok: true,
        category,
        restaurants,
        totalPages: (Math.ceil(totalResults / 25)),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not find category'
      };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        take: 25,
        skip: (page - 1) * 25,
        order: {
          isPromoted: 'DESC'
        }
      });
      return {
        ok: true,
        results: restaurants,
        totalPages: (Math.ceil(totalResults / 25)),
        totalResults,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load restaurants'
      };
    }
  }

  async findRestaurantById({ restaurantId }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, {
        relations: ['menu'],
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found'
        };
      }
      return {
        ok: true,
        restaurant
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not find restaurant'
      };
    }
  }

  async searchRestaurantByName({ query, page }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          name: Raw(name => `${name} ILIKE '%${query}%'`),
        },
        take: 25,
        skip: (page - 1) * 25,
      });
      return {
        ok: true,
        results: restaurants,
        totalPages: (Math.ceil(totalResults / 25)),
        totalResults,
      }
    } catch (error) {
      return {
        ok: false,
        error: 'Could not search for restaurants'
      }
    }
  }

  async createDish(owner: User, createDishInput: CreateDishInput): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne(createDishInput.restaurantId);
      const isValid = await this.restaurants.isValid(owner, createDishInput.restaurantId);
      if (!isValid.ok) {
        return isValid;
      }
      await this.dishes.save(this.dishes.create({ ...createDishInput, restaurant }));
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create dish'
      };
    }
  }

  async editDish(owner: User, editDishInput: EditDishInput): Promise<EditDishOutput> {
    try {
      const isValid = await this.dishes.isValid(owner, editDishInput.dishId);

      if (!isValid.ok) {
        return isValid;
      }
      await this.dishes.save([{
        id: editDishInput.dishId,
        ...editDishInput,
      }]);
      return {
        ok: true
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not edit dish'
      };
    }
  }

  async deleteDish(owner: User, { dishId }: DeleteDishInput): Promise<DeleteDishOutput> {
    try {
      const isValid = await this.dishes.isValid(owner, dishId);
      if (!isValid.ok) {
        return isValid;
      }
      await this.dishes.delete(dishId);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not delete dish'
      };
    }
  }
}
