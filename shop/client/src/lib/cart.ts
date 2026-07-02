export interface CartLineItem {
  slug: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export function cartLineKey(slug: string, size: string) {
  return `${slug}|${size}`;
}
