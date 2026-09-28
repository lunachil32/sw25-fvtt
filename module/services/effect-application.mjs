import { transferEffects } from "./effect-transfer.mjs";

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

/** Apply effects to explicitly selected tokens, independent of selection dialogs. */
export function applyEffectsToTokens(tokens, effects, sourceName, sourceId) {
  const targetIds = Array.from(tokens, token => token.id);
  const actors = game.user.isGM ? Array.from(tokens, token => token.actor) : [];
  dispatchEffects(actors, targetIds, effects, sourceName, sourceId);
}

function dispatchEffects(actors, targetIds, effects, sourceName, sourceId) {
  if (game.user.isGM) {
    actors.forEach(actor => transferEffects(actor, effects, sourceName, sourceId));
  } else {
    game.socket.emit(`system.${game.system.id}`, {
      method: "applyEffect",
      targetTokens: targetIds,
      targetEffects: effects,
      orgActor: sourceName,
      orgId: sourceId,
    });
  }
}
