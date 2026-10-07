import { selectTargets } from "./target-select.mjs";

/** Open the effect target picker; callers decide what to do with selected tokens. */
export async function showEffectTargetDialog(name, onSelect) {
  const targets = await selectTargets({
    title: game.i18n.localize("SW25.TargetSelect") + `(${name})`,
    submitLabel: game.i18n.localize("SW25.Item.EffectB"),
  });
  if (targets.length) return onSelect(targets);
}
