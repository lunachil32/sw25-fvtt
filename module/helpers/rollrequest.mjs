import { SW25 } from "./config.mjs";
import { showRollRequestDialog } from "../presentation/dialogs/roll-request.mjs";

/** Collect the request input, then post the existing request card. */
export async function rollreq() {
  const tokens = canvas.tokens.placeables;
  const skills = new Set();
  const checks = new Set();
  for (const token of tokens) {
    if (token.actor) {
      const items = token.actor.items;
      for (const item of items) {
        if (item.type === "skill") skills.add(item);
        if (item.type === "check") checks.add(item);
      }
    }
  }
  const request = await showRollRequestDialog({
    skilllist: Array.from(skills), checklist: Array.from(checks), abilities: SW25.abilityAbbreviations,
  });
  if (!request) return;
  const { method, message, checkName, inputName, refAbility, modifier, targetValue } = request;
  const chatData = {
    speaker: ChatMessage.getSpeaker({ alias: "Gamemaster" }),
    flags: {
      sw25: {
        checkName: checkName,
        inputName: inputName,
        refAbility: refAbility,
        modifier: modifier,
        targetValue: targetValue,
        method: method,
      }
    },
  };
  chatData.content = "";
  let name = checkName;
  if (checkName == "di") name = inputName;
  if (method == "skill" && checkName && checkName != "") {
    let abi =
      " + " + game.i18n.localize(`SW25.Ability.${refAbility.capitalize()}.abbr`);
    if (refAbility == "") abi = "";
    name = `${name}${abi}`;
    if (checkName == "adv")
      name = `${game.i18n.localize(
        "SW25.Attributes.Advlevel"
      )}${abi}`;
  }
  let difficulty = targetValue
    ? game.i18n.localize("SW25.Difficulty")
    : "";

  let mod = "";
  if (modifier) {
    mod = modifier > 0 ? `+${modifier}` : modifier;
  }

  chatData.content = await renderTemplate(
    "systems/sw25-lunachil-maintained/templates/roll/rollreq-card.hbs",
    {
      checkName: name,
      message: message,
      difficulty: difficulty,
      targetValue: targetValue,
      mod: mod,
    }
  );
  return ChatMessage.create(chatData);
}
