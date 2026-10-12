export type Product = {
  id: string;
  slug: string;
  name: string;
  composition: string;
  /** Вес порции в граммах */
  weight: number;
  /** Цена в гривнах */
  price: number;
  image: {
    src: string;
    width: number;
    height: number;
  };
};
