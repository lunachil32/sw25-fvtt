/** Save a typed Item field, preserving the zero-as-unset modifier convention. */
export function editItemField(item, property, value, { numeric = false, zeroAsNull = false } = {}) {
  if (numeric) value = Number(value);
  if (zeroAsNull && value == 0) value = null;
  return item.update({ [property]: value });
}
