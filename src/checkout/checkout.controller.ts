import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutItem } from './interfaces/checkout.interface';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  async checkout(@Body() body: { items: CheckoutItem[] }) {
    try {
      if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }
      return await this.checkoutService.process(body.items);
    } catch (error) {
      if (error.message === 'Cart is empty') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
