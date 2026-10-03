import { resolveActorCheck } from "../../use-cases/actor-checks.mjs";
import { postActorCheck } from "../chat/check-roll.mjs";

/** Roll a built-in PC check using the Actor's prepared values. */
export async function rollActorQuickCheck(actor, type) {
  const check = checks[type];
  if (!Object.hasOwn(checks, type)) return;
  const result = await resolveActorCheck(actor, { formula: check.formula });
  return postActorCheck(actor, { label: game.i18n.localize(check.label) }, result);
}

const checks = {
  basic: { formula: "2d6", label: "SW25.V2.BasicCheck" },
  dodge: { formula: "2d6+@dodgebase", label: "SW25.Item.Armor.Dodge" },
};
