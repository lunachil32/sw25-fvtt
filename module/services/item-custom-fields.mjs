/** Append an empty custom field, accepting both arrays and legacy objects. */
export function addCustomField(item) {
  const fields = copyCustomFields(item.system.customFields ?? []);
  fields.push({ label: "", value: "" });
  return item.update({ "system.customFields": fields });
}

/** Remove a custom field at the selected index. */
export function removeCustomField(item, index) {
  const fields = copyCustomFields(item.system.customFields);
  fields.splice(index, 1);
  return item.update({ "system.customFields": fields });
}

/** Move a custom field toward the start, preserving the existing boundary rule. */
export function moveCustomFieldUp(item, index) {
  const fields = copyCustomFields(item.system.customFields);
  if (index > 0) {
    [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
    return item.update({ "system.customFields": fields });
  }
}

/** Move a custom field toward the end, preserving the existing boundary rule. */
export function moveCustomFieldDown(item, index) {
  const fields = copyCustomFields(item.system.customFields);
  if (index < fields.length - 1) {
    [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
    return item.update({ "system.customFields": fields });
  }
}

function copyCustomFields(fields) {
  const copy = foundry.utils.duplicate(fields);
  return Array.isArray(fields) ? copy : Object.values(copy);
}
