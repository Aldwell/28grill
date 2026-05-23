import { softDeleteGalleryItem, updateGalleryItem } from "./index.js";

export async function onRequestPut(context) {
  return updateGalleryItem(context, context.params.id);
}

export async function onRequestDelete(context) {
  return softDeleteGalleryItem(context, context.params.id);
}
