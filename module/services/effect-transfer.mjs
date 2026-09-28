/**
 * Copy effects to an actor, enable them and record their source actor.
 * Preserve the existing per-effect, unawaited document creation behavior.
 */
export function transferEffects(actor, effects, sourceName, sourceId) {
  effects.forEach((effect) => {
    const transferredEffect = foundry.utils.duplicate(effect);
    transferredEffect.disabled = false;
    transferredEffect.sourceName = sourceName;
    transferredEffect.flags = {
      sw25: {
        sourceName,
        sourceId: `Actor.${sourceId}`,
      },
    };
    actor.createEmbeddedDocuments("ActiveEffect", [transferredEffect]);
  });
}
