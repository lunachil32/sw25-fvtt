import { resolveActorCheck } from "../../use-cases/actor-checks.mjs";
import { postActorCheck } from "../chat/check-roll.mjs";

/** Roll a built-in PC check using the Actor's prepared values. */
export async function rollActorQuickCheck(actor, type) {
  const check = checks[type];
  if (!Object.hasOwn(checks, type)) return;
  const result = await resolveActorCheck(actor, { formula: check.formula });
  return postActorCheck(actor, { label: game.i18n.localize(check.label) }, result);
}

/** Present a skill check using the same prepared bonus as the V1 skill table. */
export async function rollActorSkillCheck(actor, item, ability) {
  if (item?.type !== "skill" || !["dex", "agi", "str", "vit", "int", "mnd"].includes(ability)) return;
  const bonus = item.system.skillbase[ability];
  const label = item.name + "+" + game.i18n.localize("SW25.Ability." + ability[0].toUpperCase() + ability.slice(1) + ".long") + game.i18n.localize("SW25.Ability.Bonus");
  const result = await resolveActorCheck(actor, { formula: "2d6+" + bonus, itemId: item.id });
  return postActorCheck(actor, { label }, result);
}

const checks = {
  basic: { formula: "2d6", label: "SW25.V2.BasicCheck" },
  dodge: { formula: "2d6+@dodgebase", label: "SW25.Item.Armor.Dodge" },
};
