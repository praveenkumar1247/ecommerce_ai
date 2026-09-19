export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getImageUrl = (path) => {
  if (!path) return '/placeholder-product.svg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const storageBase = import.meta.env.VITE_STORAGE_URL || 'http://localhost:5001';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${storageBase}${cleanPath}`;
};
