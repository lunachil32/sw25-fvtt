/** Prepare an effect and spend its lifeline, reporting a missing resource without aborting. */
export async function preparePhaseareaUse(actor, phasearea, cost, name) {
  const effects = [buildPhaseareaEffect(actor, phasearea, name)];
  const consumed = await spendLifeline(actor, phasearea, cost);
  return { effects, consumed };
}

/**
 * Spend the first lifeline resource matching the phasearea's type.
 * Returns false when absent. Existing rules allow a negative remaining quantity.
 */
export async function spendLifeline(actor, phasearea, cost) {
  const resource = actor.items.find(
    (item) =>
      item.type === "resource" &&
      item.system?.resource?.type === "lifeline" &&
      item.system?.resource?.lifelinetype === phasearea.system.type
  );
  if (!resource) return false;

  const previousQuantity = resource.system.quantity ? resource.system.quantity : 0;
  await resource.update({ "system.quantity": previousQuantity - cost });
  return true;
}

/** Build a phasearea effect with its source metadata and a display name. */
export function buildPhaseareaEffect(actor, phasearea, name) {
  return {
    name,
    img: phasearea.img,
    origin: "Item." + phasearea._id,
    disabled: false,
    changes: [],
    description: phasearea.system.description,
    transfer: false,
    statuses: [],
    flags: {
      sw25: {
        sourceName: actor.name,
        sourceId: `Actor.${actor._id}`,
      },
    },
    tint: null,
  };
}
