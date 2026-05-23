import { softDeleteMenuItem, updateMenuItem } from "../menu-item.js";

export async function onRequestPut(context) {
  return updateMenuItem(context, context.params.id);
}

export async function onRequestDelete(context) {
  return softDeleteMenuItem(context, context.params.id);
}
