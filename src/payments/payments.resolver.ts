import { Inject } from '@nestjs/common';
import { Args, Mutation, Resolver, Query, ResolveField, Int, Parent, Subscription } from '@nestjs/graphql';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payments.service';
import { CreatePaymentInput, CreatePaymentOutput } from './dtos/create-payment.dto';

@Resolver(of => Payment)
export class PaymentResolver {
  constructor(
    private readonly paymentService: PaymentService
  ) {}

  // @Mutation(returns => CreatePaymentOutput)
}
