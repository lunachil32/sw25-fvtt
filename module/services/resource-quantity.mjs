/**
 * Update the first matching resource, preserving collection order.
 * @returns {Promise<boolean>} Whether a matching resource was updated.
 */
export async function updateResourceQuantity(actor, resourceType, modifyValue, multiple = 1) {
  const result = isNaN(Number(modifyValue))
    ? 0
    : Number(modifyValue) * multiple;
  const resource = actor.items.find(item => matchesResource(item, resourceType));
  if (!resource) return false;

  const oldVal = resource.system.quantity ? resource.system.quantity : 0;
  const newVal = oldVal + Number(result);
  await resource.update({ "system.quantity": newVal });
  return true;
}

/**
 * Update all matching resources. A falsy modifyValue resets their quantities,
 * retaining the existing distinction between numeric 0 and string "0".
 * @returns {Promise<boolean>} Whether matching resources were updated.
 */
export async function updateAllResourceQuantities(actor, resourceType, modifyValue, multiple = 1) {
  const result = isNaN(Number(modifyValue))
    ? 0
    : Number(modifyValue) * multiple;
  const resources = actor.items.filter(item => matchesResource(item, resourceType));
  if (resources.length === 0) return false;

  const updates = resources.map(resource => {
    const oldVal = Number(resource.system.quantity ?? 0);
    const newVal = modifyValue ? oldVal + Number(result) : 0;
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
  const limits = [];
  if (item.type === "resource") {
    // Preserve the existing treatment of numeric zero as an inactive bound.
    if (item.system.qmax && quantity > item.system.qmax) {
      quantity = item.system.qmax;
      limits.push("max");
    }
    if (item.system.qmin && quantity < item.system.qmin) {
      quantity = item.system.qmin;
      limits.push("min");
    }
  }
  return { quantity, limits };
}

function matchesResource(item, resourceType) {
  if (item.type !== "resource") return false;
  const resource = item.system?.resource;
  return resource && Object.entries(resourceType).every(
    ([key, value]) => resource[key] === value
  );
}
