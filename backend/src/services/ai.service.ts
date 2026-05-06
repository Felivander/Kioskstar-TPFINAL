// AI Vision Service placeholder
// TODO: Integrar con Claude Vision API o Google Vision API

export const analyzeProductImage = async (imageBase64: string): Promise<{
  name: string;
  barcode: string | null;
  description: string;
  price: number;
}> => {
  // Placeholder - integrar con API de visión
  console.log('analyzeProductImage called - pending integration');
  return {
    name: 'Producto detectado por IA',
    barcode: null,
    description: 'Descripción generada por IA',
    price: 0,
  };
};
