const isLocal = true;
export const url = isLocal
  ? import.meta.env.VITE_LOCAL_URL
  : import.meta.env.VITE_PROD_URL; 