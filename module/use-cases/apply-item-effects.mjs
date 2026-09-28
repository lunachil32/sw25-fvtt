import { dispatchEffects } from "../services/effect-application.mjs";

/** Resolve self/selected targets and apply an Item's effects or request GM application. */
export function applyItemEffects(actor, item, targets, sourceName = actor.name, sourceId = actor.id) {
  const effectNames = [];
  item.effects.forEach(effect => effectNames.push(effect.name));
  const targetNames = [];
  const targetActors = [];
  let targetIds = Array.from(targets, target => target.id);

  if (item.system.selfbuff) {
    targetNames.push(actor.name);
    if (game.user.isGM) {
      targetActors.push(actor);
    } else {
      targetIds = actor.token ? actor.token.id : [actor.getActiveTokens()[0]?.id];
    }
  } else {
    targets.forEach(target => {
      targetActors.push(target.actor);
      targetNames.push(target.actor.name);
    });
  }

  dispatchEffects(targetActors, targetIds, item.effects, sourceName, sourceId);
  return { targetNames, effectNames };
}
