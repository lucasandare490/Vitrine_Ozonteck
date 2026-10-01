const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type AllowedImageMime = keyof typeof MIME_EXTENSIONS;

type ImagePolicy = {
  maxBytes: number;
  maxPixels: number;
  label: string;
};

export const AVATAR_IMAGE_POLICY: ImagePolicy = {
  maxBytes: 2 * 1024 * 1024,
  maxPixels: 12_000_000,
  label: 'A imagem de perfil',
};

export const PRODUCT_IMAGE_POLICY: ImagePolicy = {
  maxBytes: 5 * 1024 * 1024,
  maxPixels: 25_000_000,
  label: 'A imagem do produto',
};

export async function validateImageUpload(file: File, policy: ImagePolicy) {
  if (!(file.type in MIME_EXTENSIONS)) {
    throw new Error(`${policy.label} deve estar no formato JPG, PNG ou WebP.`);
  }
  if (file.size <= 0 || file.size > policy.maxBytes) {
    const maxMegabytes = Math.round(policy.maxBytes / 1024 / 1024);
    throw new Error(`${policy.label} deve ter no máximo ${maxMegabytes} MB.`);
  }

  const mime = file.type as AllowedImageMime;
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesImageSignature(header, mime)) {
    throw new Error('O conteúdo do arquivo não corresponde a uma imagem válida.');
  }

  const dimensions = await readImageDimensions(file);
  if (dimensions.width * dimensions.height > policy.maxPixels) {
    throw new Error(`${policy.label} possui resolução excessiva.`);
  }

  return {
    extension: MIME_EXTENSIONS[mime],
    contentType: mime,
    width: dimensions.width,
    height: dimensions.height,
  };
}

function matchesImageSignature(bytes: Uint8Array, mime: AllowedImageMime) {
  if (mime === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }
  return bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50;
}

async function readImageDimensions(file: File) {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }

  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível ler a imagem selecionada.'));
    };
    image.src = objectUrl;
  });
}
