/**
 * Spend the first matching material-card Item for each required color.
 * Preserves existing alchemy rules: quantities may become negative, and missing
 * cards are reported without stopping subsequent colors or rank updates.
 */
export async function spendMaterialCards(actor, alchemy, rank) {
  const results = [];
  for (const color of ["red", "green", "black", "white", "gold"]) {
    if (!isNaN(alchemy.system[color]) && alchemy.system[color] <= 0) {
      continue;
    }

    const resource = actor.items.find(
      (item) =>
        item.type === "resource" &&
        item.system?.resource?.type === "material" &&
        item.system?.resource?.materialtype === color &&
        item.system?.resource?.materialrank === rank
    );

    let previousQuantity = null;
    let remainingQuantity = null;
    if (resource) {
      previousQuantity = resource.system.quantity ? resource.system.quantity : 0;
      remainingQuantity = previousQuantity - alchemy.system[color];
      await resource.update({ "system.quantity": remainingQuantity });
    }

    results.push({
      color,
      cost: alchemy.system[color],
      resource: Boolean(resource),
      previousQuantity,
      remainingQuantity,
    });
  }
  return results;
}
