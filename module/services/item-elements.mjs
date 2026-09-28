import { getPropertyElements, getWeaponTypeElements } from "../rules/elements.mjs";

/** Update element flags to match a selected property. */
export async function applyPropertyElements(item, prop) {
  const elements = getPropertyElements(prop);
  if (!elements) return false;
  await item.update(toElementUpdates(elements));
  return true;
}

/** Update blade/blow flags for a weapon type, preserving other elements. */
export async function applyWeaponTypeElements(item, prop) {
  if (item.type != "weapon") return false;
  const elements = getWeaponTypeElements(prop);
  if (!elements) return false;
  await item.update(toElementUpdates(elements));
  return true;
}

function toElementUpdates(elements) {
  return Object.fromEntries(Object.entries(elements).map(([key, value]) => [
    "system.elements." + key, value,
  ]));
}
