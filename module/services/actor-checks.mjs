import { consumeResource } from "./resource-consumption.mjs";
import { DamageSupporter } from "../helpers/damagesupport.mjs";

/** Evaluate a check and its automatic cost without opening a sheet or posting chat. */
export async function resolveActorCheck(actor, {
  formula,
  itemId,
  resourceId,
  resourceAmount,
}) {
  const roll = new Roll(formula, actor.getRollData());
  await roll.evaluate();

  let resourceCost;
  if (resourceId) {
    const resource = actor.items.get(resourceId);
    const result = await consumeResource(resource, resourceAmount);
    resourceCost = { ...result, name: resource.name };
    if (!result.consumed) return { roll, resourceCost };
  }

  let critical = null;
  let fumble = null;
  if (roll.terms[0].total == 12) critical = 1;
  if (roll.terms[0].total == 2) fumble = 1;

  const item = itemId ? actor.items.get(itemId) : null;
  const elements = item ? item.system.elements : null;
  const damage = actor ? actor.system.attributes.damage : null;
  const classType = actor ? actor.system.classType : null;
  const isWeapon = DamageSupporter.getWeaponAttributes(item);
  const tags = DamageSupporter.createChatTag(elements, damage, classType, isWeapon);

  return { roll, resourceCost, critical, fumble, elements, damage, tags };
}
