import { Test } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: {
    getMySubscription: jest.Mock;
    createCheckoutOrder: jest.Mock;
    verifyPayment: jest.Mock;
    cancel: jest.Mock;
    listPlanPrices: jest.Mock;
    setPlanPrice: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getMySubscription: jest.fn(),
      createCheckoutOrder: jest.fn(),
      verifyPayment: jest.fn(),
      cancel: jest.fn(),
      listPlanPrices: jest.fn(),
      setPlanPrice: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [{ provide: SubscriptionsService, useValue: service }],
    }).compile();

    controller = module.get(SubscriptionsController);
  });

  it('delegates getMine to the service with the current user id', async () => {
    service.getMySubscription.mockResolvedValue({
      subscriptionStatus: 'TRIAL',
    });

    await controller.getMine({ userId: 'user-1', role: 'LAWYER' });

    expect(service.getMySubscription).toHaveBeenCalledWith('user-1');
  });

  it('delegates createCheckoutOrder to the service with the dto', async () => {
    const dto = { planName: 'STANDARD' };

    await controller.createCheckoutOrder(
      { userId: 'user-1', role: 'LAWYER' },
      dto,
    );

    expect(service.createCheckoutOrder).toHaveBeenCalledWith('user-1', dto);
  });

  it('delegates verifyPayment to the service with the dto', async () => {
    const dto = {
      razorpayOrderId: 'order_abc',
      razorpayPaymentId: 'pay_abc',
      razorpaySignature: 'sig',
    };

    await controller.verifyPayment({ userId: 'user-1', role: 'LAWYER' }, dto);

    expect(service.verifyPayment).toHaveBeenCalledWith('user-1', dto);
  });

  it('delegates cancel to the service with the current user id', async () => {
    await controller.cancel({ userId: 'user-1', role: 'LAWYER' });

    expect(service.cancel).toHaveBeenCalledWith('user-1');
  });

  it('delegates listPlanPrices to the service', async () => {
    await controller.listPlanPrices();

    expect(service.listPlanPrices).toHaveBeenCalled();
  });

  it('delegates setPlanPrice to the service with the plan name and amount', async () => {
    await controller.setPlanPrice('STANDARD', { amount: 1500 });

    expect(service.setPlanPrice).toHaveBeenCalledWith('STANDARD', 1500);
  });
});
