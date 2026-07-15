export function getOptimizedImageUrl(url: string, width?: number, height?: number): string {
  if (!url) return '';
  
  // If it's a Supabase storage URL, we can append transform parameters
  // Assuming the storage URL contains '/storage/v1/object/public/'
  if (url.includes('/storage/v1/object/public/')) {
    // If it already has query parameters, append to them, otherwise add them
    const separator = url.includes('?') ? '&' : '?';
    let params = `quality=80&format=webp`;
    
    if (width) params += `&width=${width}`;
    if (height) params += `&height=${height}`;
    
    return `${url}${separator}${params}`;
  }
  
  return url;
}
