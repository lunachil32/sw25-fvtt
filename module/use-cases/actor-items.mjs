/** Create an embedded item using the system's normal document defaults. */
export async function createActorItem(actor, type) {
  const name = game.i18n.format("DOCUMENT.New", { type: game.i18n.localize("TYPES.Item." + type) });
  const [item] = await actor.createEmbeddedDocuments("Item", [{ name, type }]);
  return item;
}

/** Delete an explicitly selected embedded item after the UI has confirmed the operation. */
export async function deleteActorItem(actor, itemId) {
  return actor.deleteEmbeddedDocuments("Item", [itemId]);
}
