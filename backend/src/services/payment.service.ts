// MercadoPago Service placeholder
// TODO: Integrar con MercadoPago SDK

export const createPaymentPreference = async (data: {
  title: string;
  description?: string;
  amount: number;
  payerEmail?: string;
}): Promise<{ id: string; init_point: string }> => {
  console.log('createPaymentPreference called - pending integration');
  return {
    id: 'placeholder-preference-id',
    init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect',
  };
};
