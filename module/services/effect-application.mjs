import { transferEffects } from "./effect-transfer.mjs";

/** Apply effects to explicitly selected tokens, independent of selection dialogs. */
export function applyEffectsToTokens(tokens, effects, sourceName, sourceId) {
  const targetIds = Array.from(tokens, token => token.id);
  const actors = game.user.isGM ? Array.from(tokens, token => token.actor) : [];
  dispatchEffects(actors, targetIds, effects, sourceName, sourceId);
}

/** Create already prepared effects as a batch, or request GM application. */
export function applyPreparedEffectsToTokens(tokens, effects, sourceName, sourceId) {
  if (game.user.isGM) {
    tokens.forEach(token => token.actor.createEmbeddedDocuments("ActiveEffect", effects));
  } else {
    requestEffects(Array.from(tokens, token => token.id), effects, sourceName, sourceId);
  }
}

/** Dispatch effects through local Documents or the system socket. */
export function dispatchEffects(actors, targetIds, effects, sourceName, sourceId) {
  if (game.user.isGM) {
    actors.forEach(actor => transferEffects(actor, effects, sourceName, sourceId));
  } else {
    requestEffects(targetIds, effects, sourceName, sourceId);
  }
}

function requestEffects(targetIds, effects, sourceName, sourceId) {
  game.socket.emit(`system.${game.system.id}`, {
    method: "applyEffect",
    targetTokens: targetIds,
    targetEffects: effects,
    orgActor: sourceName,
    orgId: sourceId,
  });
}
