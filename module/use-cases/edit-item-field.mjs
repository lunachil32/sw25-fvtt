import { limitResourceQuantity } from "../services/resource-quantity.mjs";

/** Save a typed Item field, preserving the zero-as-unset modifier convention. */
export function editItemField(item, property, value, { numeric = false, zeroAsNull = false } = {}) {
  if (numeric) value = Number(value);
  if (zeroAsNull && value == 0) value = null;
  return item.update({ [property]: value });
}

/** Prepare a button value, retaining its integer conversion and optional resource bounds. */
export function prepareItemFieldAdjustment(item, value, action, { limitQuantity = false } = {}) {
  value = parseInt(value);
  if (isNaN(value)) value = 0;
  if (action === "decrease") value -= 1;
  else if (action === "increase") value += 1;

  if (limitQuantity) {
    const limited = limitResourceQuantity(item, value);
    return { value: limited.quantity, limits: limited.limits };
  }
  return { value, limits: [] };
}

/** Preserve both legacy button writes: await the DOM-specified field, then start the follow-up. */
export async function saveItemFieldAdjustment(item, property, value, followupProperty) {
  await editItemField(item, property, value);
  saveFollowupField(item, followupProperty, value);
}

// The old sheet's async helper wrapped synchronous failures and was not awaited.
async function saveFollowupField(item, property, value) {
  await editItemField(item, property, value);
}
