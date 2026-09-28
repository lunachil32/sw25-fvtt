import { isMaterialCardRequired, getAlchemyRankAdjustment } from "../rules/alchemy.mjs";
import { calculateUnboundedConsumption } from "../rules/resource-consumption.mjs";

/**
 * Spend the first matching material-card Item for each required color.
 * Preserves existing alchemy rules: quantities may become negative, and missing
 * cards are reported without stopping subsequent colors or rank updates.
 */
export async function spendMaterialCards(actor, alchemy, rank) {
  const results = [];
  for (const color of ["red", "green", "black", "white", "gold"]) {
    if (!isMaterialCardRequired(alchemy.system[color])) {
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
      ({ previousQuantity, remainingQuantity } = calculateUnboundedConsumption(resource.system.quantity, alchemy.system[color]));
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

/** Apply the selected rank to the alchemy Item's effects or dice formula. */
export async function applyAlchemyRank(alchemy, rank) {
  const adjustment = getAlchemyRankAdjustment(alchemy.system.effectvalue, rank);
  if (adjustment && alchemy.effects) {
    const { type, value: changeValue } = adjustment;
    const updates = [];

    if (type === "diceformula") {
      await alchemy.update({ "system.customformula": String(changeValue) });
    } else {
      for (let effect of alchemy.effects) {
        const updateData = { _id: effect.id };

        if (type === "time") {
          updateData.duration = { rounds: Number(changeValue) };
        } else if (type === "value") {
          updateData.changes = effect.changes.map((c) => ({
            ...c,
            value: Number(changeValue),
          }));
        }

        updates.push(updateData);
      }
      await alchemy.updateEmbeddedDocuments("ActiveEffect", updates);
    }
  }
}
