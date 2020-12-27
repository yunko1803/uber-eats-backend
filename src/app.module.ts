import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [GraphQLModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
