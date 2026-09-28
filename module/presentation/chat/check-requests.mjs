export function postMonsterReveal(actor) {
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: game.i18n.localize("SW25.RevealMonsterData"),
    flags: {},
    content: `@UUID[Actor.${actor.id}]`,
  });
}

/** Present an ordinary check request. */
export async function postActorCheckRequest(actor, request) {
  await postCheckRequest(request, {
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    message: request.checkName + game.i18n.localize("SW25.Check"),
    difficulty: game.i18n.localize("SW25.Difficulty"),
  });
}

/** Use the revealed or anonymous speaker appropriate for a monster check. */
export async function postMonsterCheckRequest(actor, kind, request, isView) {
  const classType = actor.system.classType;
  const typeName = !classType || classType === "Other"
    ? actor.system.type
    : game.i18n.localize(`SW25.Actor.Class.${classType}`);
  const message = kind === "knowledge"
    ? `${game.i18n.localize("SW25.Monster.Popularity")}/${game.i18n.localize("SW25.Monster.Weakpoint")}`
    : game.i18n.localize("SW25.Monster.Preemptive");
  await postCheckRequest(request, {
    speaker: isView
      ? ChatMessage.getSpeaker({ actor: actor })
      : ChatMessage.getSpeaker({ alias: "Gamemaster" }),
    message,
    difficulty: `@UUID[Actor.${actor.id}](${typeName})`,
  });
}

/** Present a completed operation as chat without depending on a sheet. */
async function postCheckRequest(request, { speaker, message, difficulty }) {
  const content = await renderTemplate(
    "systems/sw25-lunachil-maintained/templates/roll/rollreq-card.hbs",
    {
      checkName: request.checkName,
      message,
      difficulty,
      targetValue: request.targetValue,
      mod: request.modifier,
    }
  );
  ChatMessage.create({ speaker, flavor: request.checkName, flags: { sw25: request }, content });
}
