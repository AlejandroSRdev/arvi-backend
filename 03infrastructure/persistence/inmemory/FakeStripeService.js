/**
 * Layer: Infrastructure
 * File: FakeStripeService.js
 * Responsibility:
 * Stub Stripe service used when ARVI_TEST_MODE=true so that billing endpoints
 * can be exercised without hitting Stripe.
 */

export const fakeStripeService = {
  async createCheckoutSession() {
    return { id: 'cs_test_fake', url: 'https://stripe.test/checkout/fake' };
  },
};

export default fakeStripeService;
