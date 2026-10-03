import { onManageActiveEffect } from "../../helpers/effects.mjs";

/** Adapt V2 action buttons to the existing effect management operation. */
export function manageEffectV2(event, button) {
  if (!this.isEditable) return;
  const row = button.closest("li");
  const parentId = row.dataset.parentId;
  const owner = !parentId || parentId === this.document.id
    ? this.document : this.document.items?.get(parentId);
  if (!owner?.isOwner) return;
  return onManageActiveEffect({ preventDefault() {}, currentTarget: button }, owner);
}
