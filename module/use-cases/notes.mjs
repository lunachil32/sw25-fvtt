import { updateResourceQuantity } from "../services/resource-quantity.mjs";

/** Gain a song's normal notes. Returns the resource criteria that were not found. */
export async function gainNotes(actor, song) {
  return updateNotes(actor, song, "get");
}

/** Gain a song's additional notes. Returns the resource criteria that were not found. */
export async function gainAdditionalNotes(actor, song) {
  return updateNotes(actor, song, "add");
}

/** Spend a finale's notes. Returns the resource criteria that were not found. */
export async function spendNotes(actor, song) {
  return updateNotes(actor, song, "cost", -1);
}

async function updateNotes(actor, song, field, multiple = 1) {
  const missingResources = [];
  for (const noteType of ["up", "down", "charm"]) {
    const amount = song.system[noteType + field];
    if (!amount) continue;

    const resourceType = { type: "note", notetype: noteType };
    const updated = await updateResourceQuantity(actor, resourceType, amount, multiple);
    if (!updated) missingResources.push(resourceType);
  }
  return missingResources;
}
