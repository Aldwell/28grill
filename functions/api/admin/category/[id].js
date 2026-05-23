import { updateCategory } from "../category.js";

export async function onRequestPut(context) {
  return updateCategory(context, context.params.id);
}
