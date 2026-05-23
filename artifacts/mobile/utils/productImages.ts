import { Directory, File, Paths } from "expo-file-system";

const PRODUCT_IMAGE_DIR = "product-images";

export const PRODUCT_IMAGE_PICKER_OPTIONS = {
  quality: 0.58,
  allowsEditing: true,
  aspect: [1, 1] as [number, number],
};

export async function saveProductImageAsync(uri: string) {
  const dir = new Directory(Paths.document, PRODUCT_IMAGE_DIR);
  dir.create({ intermediates: true, idempotent: true });

  const destination = new File(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
  new File(uri).copy(destination);
  return destination.uri;
}

export async function deleteProductImageAsync(uri?: string | null) {
  if (!uri || !uri.includes(`/${PRODUCT_IMAGE_DIR}/`)) return;

  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Image cleanup must not block product editing.
  }
}
