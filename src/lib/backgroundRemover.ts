export interface BackgroundRemovalOptions {
  autoTrim?: boolean;
}

/**
 * Normalizes and cleans image buffer on canvas to eliminate corrupt EXIF/headers
 */
export async function sanitizeImageDataUrl(imageSource: string | File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxDim = 800;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, w);
      canvas.height = Math.max(1, h);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof imageSource === 'string' ? imageSource : '');
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => {
      if (typeof imageSource === 'string') {
        resolve(imageSource);
      } else {
        const r = new FileReader();
        r.onload = (e) => resolve(e.target?.result as string);
        r.onerror = reject;
        r.readAsDataURL(imageSource);
      }
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const r = new FileReader();
      r.onload = (e) => {
        img.src = e.target?.result as string;
      };
      r.onerror = reject;
      r.readAsDataURL(imageSource);
    }
  });
}

export async function removeImageBackground(
  imageSource: string | File,
  customApiKey?: string,
  rotation: number = 0
): Promise<string[]> {
  const dataUrl = await sanitizeImageDataUrl(imageSource);

  try {
    const response = await fetch('/api/remove-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customApiKey ? { 'x-gemini-key': customApiKey } : {})
      },
      body: JSON.stringify({ imageBase64: dataUrl, rotation })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        if (data.imageUrl) {
          return [data.imageUrl];
        }
        if (Array.isArray(data.images) && data.images.length > 0) {
          return data.images;
        }
      }
    }
  } catch (err) {
    console.warn('Server background removal request encountered an error, applying local fallback:', err);
  }

  // Graceful fallback to prevent disrupting item ingestion
  return [dataUrl];
}

export async function extractRegionAndRemoveBackground(
  imageSource: string | File,
  box2d: [number, number, number, number],
  options: any = {}
): Promise<{
  cutoutDataUrl: string;
  croppedOriginalUrl: string;
}> {
  // If we just need to get the sub-region and remove background, we can just use removeImageBackground
  // Wait, if we send the whole image and box2d, the old code cropped the image then called removeBackground
  // To keep it simple, we can do the cropping here.
  
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    if (typeof imageSource === 'string') {
      i.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { i.src = e.target?.result as string; };
      reader.readAsDataURL(imageSource);
    }
  });

  const fullW = img.naturalWidth || img.width;
  const fullH = img.naturalHeight || img.height;

  let [ymin, xmin, ymax, xmax] = box2d;
  if (ymax > 1.0 || xmax > 1.0) {
    ymin = ymin / 1000;
    xmin = xmin / 1000;
    ymax = ymax / 1000;
    xmax = xmax / 1000;
  }

  const boxW = xmax - xmin;
  const boxH = ymax - ymin;
  const padX = boxW * 0.15;
  const padY = boxH * 0.15;

  const cropX = Math.max(0, Math.floor((xmin - padX) * fullW));
  const cropY = Math.max(0, Math.floor((ymin - padY) * fullH));
  const cropW = Math.min(fullW - cropX, Math.ceil((boxW + padX * 2) * fullW));
  const cropH = Math.min(fullH - cropY, Math.ceil((boxH + padY * 2) * fullH));

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) throw new Error('Canvas 2D context unavailable');

  cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  const croppedOriginalUrl = cropCanvas.toDataURL('image/jpeg', 0.9);

  // Then send it to the AI for background removal
  const images = await removeImageBackground(croppedOriginalUrl);

  return {
    cutoutDataUrl: images[0] || croppedOriginalUrl,
    croppedOriginalUrl,
  };
}
