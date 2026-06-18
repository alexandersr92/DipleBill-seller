interface ICurrency {
  code: string;
  symbol: string;
  name: string;
}

export const currencies: ICurrency[] = [
  { code: 'NIO', symbol: 'C$', name: 'Córdoba Nicaragüense' },
  { code: 'CRC', symbol: '₡', name: 'Colón Costarricense' },
  { code: 'HNL', symbol: 'L', name: 'Lempira Hondureña' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense' },
  { code: 'EUR', symbol: '€', name: 'Euro' }
];
