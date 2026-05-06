export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
};

export const formatDate = (dateInput: string | Date | number) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};
