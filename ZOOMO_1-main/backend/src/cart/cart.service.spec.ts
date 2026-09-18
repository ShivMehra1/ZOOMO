import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../common/prisma.service';

describe('CartService', () => {
  let service: CartService;
  const prisma = {
    dish: { findUnique: jest.fn() },
    cart: { findUnique: jest.fn(), create: jest.fn() },
    cartItem: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const kitchen = {
    id: 'pizza-palace',
    isApproved: true,
    isActive: true,
  };
  const dish = {
    id: 'dish-1',
    restaurantId: 'pizza-palace',
    isAvailable: true,
    restaurant: kitchen,
    sizes: [{ id: 'size-m', label: 'Medium', price: 299 }],
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(CartService);
  });

  function emptyCart() {
    return { id: 'cart-1', userId: 'user-1', items: [] };
  }

  it('adds a dish and returns the cart items', async () => {
    prisma.dish.findUnique.mockResolvedValue(dish);
    prisma.cart.findUnique
      .mockResolvedValueOnce(emptyCart())
      .mockResolvedValueOnce({
        id: 'cart-1',
        userId: 'user-1',
        items: [{ id: 'line-1', dishId: 'dish-1', quantity: 1, dish }],
      });
    prisma.cartItem.findFirst.mockResolvedValue(null);
    prisma.cartItem.create.mockResolvedValue({ id: 'line-1' });

    const res = await service.addItem('user-1', { dishId: 'dish-1', quantity: 1, dishSizeId: 'size-m' });
    expect(prisma.cartItem.create).toHaveBeenCalled();
    expect(res.items).toHaveLength(1);
  });

  it('rejects unknown dish ids (the slug-catalog mismatch)', async () => {
    prisma.dish.findUnique.mockResolvedValue(null);
    await expect(
      service.addItem('user-1', { dishId: 'pizza-palace__margherita-double-cheese' }),
    ).rejects.toThrow('Dish not found');
  });

  it('keeps items from two restaurants in one cart', async () => {
    prisma.dish.findUnique.mockResolvedValue({
      ...dish,
      id: 'dish-2',
      restaurantId: 'moonlight-cafe',
      restaurant: { id: 'moonlight-cafe', isApproved: true, isActive: true },
      sizes: [],
    });
    prisma.cart.findUnique
      .mockResolvedValueOnce({
        id: 'cart-1',
        userId: 'user-1',
        items: [{ id: 'line-1', dishId: 'dish-1' }],
      })
      .mockResolvedValueOnce({
        id: 'cart-1',
        userId: 'user-1',
        items: [
          { id: 'line-1', dishId: 'dish-1' },
          { id: 'line-2', dishId: 'dish-2' },
        ],
      });
    prisma.cartItem.findFirst.mockResolvedValue(null);
    prisma.cartItem.create.mockResolvedValue({ id: 'line-2' });

    const res = await service.addItem('user-1', { dishId: 'dish-2' });
    expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
    expect(prisma.cartItem.create).toHaveBeenCalled();
    expect(res.items).toHaveLength(2);
  });

  it('rejects a size that does not belong to the dish', async () => {
    prisma.dish.findUnique.mockResolvedValue(dish);
    await expect(
      service.addItem('user-1', { dishId: 'dish-1', dishSizeId: 'not-a-size' }),
    ).rejects.toThrow('That size is not available for this dish');
  });
});
