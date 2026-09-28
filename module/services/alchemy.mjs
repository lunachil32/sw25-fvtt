/** Spend the required cards, apply the rank and refresh the source Actor. */
export async function useAlchemy(actor, alchemy, rank) {
  const results = await spendMaterialCards(actor, alchemy, rank);
  await applyAlchemyRank(alchemy, rank);
  // Retain the existing unawaited Actor refresh.
  actor.update({});
  return results;
}

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

/** Apply the selected rank to the alchemy Item's effects or dice formula. */
export async function applyAlchemyRank(alchemy, rank) {
  if ((alchemy.system.effectvalue?.type && alchemy.system.effectvalue.type !== "-")
      && alchemy.effects) {
    const changeValue = alchemy.system.effectvalue[rank];
    if (changeValue) {
      const updates = [];

      if (alchemy.system.effectvalue.type === "diceformula") {
        await alchemy.update({ "system.customformula": String(changeValue) });
      } else {
        for (let effect of alchemy.effects) {
          const updateData = { _id: effect.id };

          if (alchemy.system.effectvalue.type === "time") {
            updateData.duration = { rounds: Number(changeValue) };
          } else if (alchemy.system.effectvalue.type === "value") {
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
}
