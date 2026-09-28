/** Build a requested check, including the return-check target adjustment. */
export function createActorCheckRequest(checkName, targetValue) {
  if (checkName == game.i18n.localize("SW25.Monster.Return")) {
    targetValue = Number(targetValue) + 1;
  }
  return createRequest(checkName, targetValue);
}

/** Prepare a monster check and make its world Actor available at LIMITED level. */
export async function prepareMonsterCheckRequest(actor, kind) {
  const setting = { knowledge: "effectMKnowPC", initiative: "effectInitPC" }[kind];
  if (!setting) throw new Error(`Unknown monster check: ${kind}`);
  const worldActor = game.actors.get(actor.id);
  const checkName = game.settings.get(game.system.id, setting);
  const isView = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER <= worldActor.ownership.default;
  if (!isView) {
    await worldActor.update({ "ownership.default": CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED });
  }

  let targetValue = actor.system.preemptive;
  if (kind === "knowledge") {
    targetValue = actor.system.popularity;
    targetValue += !isNaN(Number(actor.system.weakpoint))
      ? "/" + actor.system.weakpoint
      : "";
  }
  return { request: createRequest(checkName, targetValue), isView };
}

/** Reveal the world Actor according to the requesting Actor's visibility. */
export async function revealMonsterData(actor) {
  const worldActor = game.actors.get(actor.id);
  if (CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER > actor.ownership.default) {
    await worldActor.update({ "ownership.default": CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER });
  }
}

function createRequest(checkName, targetValue) {
  return { checkName, inputName: "", refAbility: "", modifier: "", targetValue, method: "check" };
}
