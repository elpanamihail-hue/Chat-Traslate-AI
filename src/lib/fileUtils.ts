
/**
 * Compresses an image in the client using Canvas.
 * Ensures the output is less than 1MB if possible by adjusting quality and resolution.
 */
export async function compressImage(file: File, maxWidth = 1280, maxHeight = 1280, initialQuality = 0.8): Promise<File | Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not found'));
        
        ctx.drawImage(img, 0, 0, width, height);

        // Recursive function to ensure size is below 1MB
        const getBlob = (quality: number) => {
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Canvas toBlob failed'));
            
            // If blob > 1MB and quality > 0.1, try lower quality
            if (blob.size > 1024 * 1024 && quality > 0.1) {
              getBlob(quality - 0.1);
            } else {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }
          }, 'image/jpeg', quality);
        };

        getBlob(initialQuality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
