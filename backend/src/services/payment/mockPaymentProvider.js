/**
 * Mock Payment Provider
 * Simulates integration with a real payment gateway (e.g. Stripe, Razorpay)
 */
class MockPaymentProvider {
  /**
   * Simulates processing / verifying payment on the gateway server
   */
  async processPayment({ orderNumber, amount, currency = 'INR', paymentMethod, paymentDetails = {} }) {
    // Artificial latency for realism
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Support deliberate failure simulation for edge-case testing
    if (
      paymentDetails.simulateFailure ||
      (paymentDetails.cardNumber && paymentDetails.cardNumber.endsWith('0000'))
    ) {
      return {
        success: false,
        transactionId: `TXN-FAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        message: 'Payment rejected by issuing bank (Simulated card failure).',
        rawResponse: {
          code: 'CARD_DECLINED',
          declineReason: 'INSUFFICIENT_FUNDS_OR_TEST_TRIGGER',
        },
      };
    }

    const transactionId = `TXN-${paymentMethod}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    return {
      success: true,
      transactionId,
      amount,
      currency,
      paymentMethod,
      message: 'Payment authorized and verified successfully.',
      rawResponse: {
        gateway: 'MockPaymentGateway_v2',
        status: 'CAPTURED',
        authCode: `AUTH_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

module.exports = new MockPaymentProvider();
