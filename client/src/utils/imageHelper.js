const API_URL = 'http://localhost:5000';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/uploads/')) {
    return `${API_URL}${imagePath}`;
  }
  if (!imagePath.startsWith('/')) {
    return `${API_URL}/uploads/properties/${imagePath}`;
  }
  return `${API_URL}${imagePath}`;
};

export const getPropertyImage = (property) => {
  if (!property || !property.images || property.images.length === 0) {
    return null;
  }
  return getImageUrl(property.images[0]);
};

export const getPropertyImages = (property) => {
  if (!property || !property.images || property.images.length === 0) {
    return [];
  }
  return property.images.map(img => getImageUrl(img));
};