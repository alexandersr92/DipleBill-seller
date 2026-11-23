export const formatQuantity = (value: number | string | null | undefined): string => {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return '0';
  return quantity.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 5 });
};
