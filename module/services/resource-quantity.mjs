import { calculateResourceAdjustment, addResourceQuantity, resetOrAddResourceQuantity, limitResourceQuantity as calculateResourceLimits } from "../rules/resource-quantity.mjs";

/**
 * Update the first matching resource, preserving collection order.
 * @returns {Promise<boolean>} Whether a matching resource was updated.
 */
export async function updateResourceQuantity(actor, resourceType, modifyValue, multiple = 1) {
  const result = calculateResourceAdjustment(modifyValue, multiple);
  const resource = actor.items.find(item => matchesResource(item, resourceType));
  if (!resource) return false;

  const newVal = addResourceQuantity(resource.system.quantity, result);
  await resource.update({ "system.quantity": newVal });
  return true;
}

/**
 * Update all matching resources. A falsy modifyValue resets their quantities,
 * retaining the existing distinction between numeric 0 and string "0".
 * @returns {Promise<boolean>} Whether matching resources were updated.
 */
export async function updateAllResourceQuantities(actor, resourceType, modifyValue, multiple = 1) {
  const result = calculateResourceAdjustment(modifyValue, multiple);
  const resources = actor.items.filter(item => matchesResource(item, resourceType));
  if (resources.length === 0) return false;

  const updates = resources.map(resource => {
    const newVal = resetOrAddResourceQuantity(resource.system.quantity, result, !modifyValue);
    return {
      _id: resource.id,
      system: { quantity: newVal },
    };
  });
  await actor.updateEmbeddedDocuments("Item", updates);
  return true;
}

/** Apply resource bounds without updating the item or displaying warnings. */
export function limitResourceQuantity(item, quantity) {
  if (item.type !== "resource") return { quantity, limits: [] };
  return calculateResourceLimits(quantity, { min: item.system.qmin, max: item.system.qmax });
}

function matchesResource(item, resourceType) {
  if (item.type !== "resource") return false;
  const resource = item.system?.resource;
  return resource && Object.entries(resourceType).every(
    ([key, value]) => resource[key] === value
  );
}
