export async function buildCart(cartItems) {
  const items = cartItems
    .filter((item) => item.productId)
    .map((item) => {
      const product = item.productId.toJSON();
      return {
        id: item.id,
        quantity: item.quantity,
        product,
        lineTotal: product.price * item.quantity
      };
    });

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.lineTotal, 0)
  };
}
