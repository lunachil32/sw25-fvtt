import { DamageSupporter } from "../helpers/damagesupport.mjs";

/** Read the item elements and actor damage modifiers used by check and power rolls. */
export function getActorDamageContext(actor, itemId) {
  const item = itemId ? actor.items.get(itemId) : null;
  const elements = item ? item.system.elements : null;
  const damage = actor ? actor.system.attributes.damage : null;
  const classType = actor ? actor.system.classType : null;
  const isWeapon = DamageSupporter.getWeaponAttributes(item);
  const tags = DamageSupporter.createChatTag(elements, damage, classType, isWeapon);

  return { elements, damage, tags };
}
