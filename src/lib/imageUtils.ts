import heic2any from 'heic2any';

export async function processSelectedFile(file: File): Promise<string> {
  let blobToRead: Blob = file;
  if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
    try {
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
      blobToRead = Array.isArray(converted) ? converted[0] : converted;
    } catch (e) {
      console.warn("HEIC conversion failed, proceeding with original", e);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blobToRead);
  });
}
