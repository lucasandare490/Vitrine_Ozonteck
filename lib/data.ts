export interface Product {
  id: string;
  code: string;
  category: string;
  name: string;
  description: string;
  price: number;
  imagePlaceholder: string;
  estoque?: number;
}