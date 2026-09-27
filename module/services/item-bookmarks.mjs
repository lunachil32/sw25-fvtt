/**
 * Bookmark an owned Item by ID, then by the first exact name match.
 * If neither exists, copy the source Item with its bookmark enabled.
 */
export async function bookmarkItem(actor, item) {
  const ownedItem = actor.items.get(item.id);
  if (ownedItem) {
    await ownedItem.update({ "system.bookmark": true });
  } else {
    const sameNameItem = actor.items.find((owned) => owned.name === item.name);
    if (sameNameItem) {
      await sameNameItem.update({ "system.bookmark": true });
    } else {
      const newItemData = foundry.utils.duplicate(item.toObject());
      newItemData.system.bookmark = true;
      await actor.createEmbeddedDocuments("Item", [newItemData]);
    }
  }
}

/** Toggle an Item's bookmark and return its update promise. */
export function toggleItemBookmark(item) {
  return item.update({ "system.bookmark": !item.system.bookmark });
}
