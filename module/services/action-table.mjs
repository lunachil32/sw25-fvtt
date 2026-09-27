/**
 * Assign an action to a Fellow/Daemon table slot, or clear an unknown slot.
 * Updates the first owned Item with the same ID; otherwise copies the source
 * before assigning it, leaving the source Item unchanged.
 */
export async function assignActionTableEntry(actor, item, area) {
  const updatedData = getActionTableUpdate(area);
  const ownedItem = actor.items.get(item.id);
  if (ownedItem) {
    await ownedItem.update(updatedData);
  } else {
    const newItem = item.toObject();
    const createdItem = await actor.createEmbeddedDocuments("Item", [newItem]);
    await createdItem[0].update(updatedData);
  }
}

function getActionTableUpdate(area) {
  let updatedData = {};
  switch (area) {
    case "f17":
      updatedData = { "system.actiondice": "f1", "system.actionresult": "7" };
      break;
    case "f16":
      updatedData = { "system.actiondice": "f1", "system.actionresult": "6" };
      break;
    case "f38":
      updatedData = { "system.actiondice": "f3", "system.actionresult": "8" };
      break;
    case "f35":
      updatedData = { "system.actiondice": "f3", "system.actionresult": "5" };
      break;
    case "f59":
      updatedData = { "system.actiondice": "f5", "system.actionresult": "9" };
      break;
    case "f54":
      updatedData = { "system.actiondice": "f5", "system.actionresult": "4" };
      break;
    case "f610":
      updatedData = {
        "system.actiondice": "f6",
        "system.actionresult": "10",
      };
      break;
    case "f63":
      updatedData = { "system.actiondice": "f6", "system.actionresult": "3" };
      break;
    case "d18":
      updatedData = { "system.actiondice": "d1", "system.actionresult": "8" };
      break;
    case "d28":
      updatedData = { "system.actiondice": "d2", "system.actionresult": "8" };
      break;
    case "d49":
      updatedData = { "system.actiondice": "d4", "system.actionresult": "9" };
      break;
    case "d610":
      updatedData = {
        "system.actiondice": "d6",
        "system.actionresult": "10",
      };
      break;
    default:
      updatedData = {
        "system.actiondice": null,
        "system.actionresult": null,
      };
      break;
  }
  return updatedData;
}
