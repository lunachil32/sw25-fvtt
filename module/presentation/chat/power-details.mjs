import { calculatePowerModifier } from "../../rules/checks.mjs";

/** Format power results and visibility flags for the chat template. */
export function preparePowerRollDetails(roll) {
  let cValueFormula = "@" + roll.cValue;
  let halfFormula = "";
  let lethalTechFormula = "";
  let criticalRayFormula = "";
  let pharmToolFormula = "";
  let powupFormula = "";
  if (roll.cValue == 100) cValueFormula = "@13";
  if (roll.halfPow == 1) halfFormula = "h+" + roll.halfPowMod;
  else if (roll.halfPowMod && roll.halfPowMod != 0)
    halfFormula = "+" + roll.halfPowMod;
  if (roll.lethalTech != 0) lethalTechFormula = "#" + roll.lethalTech;
  if (roll.criticalRay > 0) criticalRayFormula = "$+" + roll.criticalRay;
  else if (roll.criticalRay != 0) criticalRayFormula = "$" + roll.criticalRay;
  if (roll.pharmTool != 0) pharmToolFormula = "tf" + roll.pharmTool;
  if (roll.powup != 0) powupFormula = "r" + roll.powup;

  let chatFormula =
    "k" +
    roll.power +
    cValueFormula +
    "+" +
    roll.powMod +
    lethalTechFormula +
    criticalRayFormula +
    pharmToolFormula +
    powupFormula +
    halfFormula;

  let chatPower = roll.power;
  let chatLethalTech = null;
  let chatCriticalRay = null;
  let chatPharmTool = null;
  let chatPowup = null;
  let chatResult = roll.eachPowerResult;
  let chatMod = roll.powMod;
  const chatModTotal = calculatePowerModifier(roll.powMod, roll.halfPow, roll.halfPowMod);
  let chatHalf = null;
  let chatResults = roll.rawPowerResult;
  let chatTotal = roll.powerResult;
  let chatExtraRoll = null;
  let chatFumble = null;
  if (roll.halfPow == 1) chatHalf = roll.halfPowMod;
  if (roll.lethalTech != 0) chatLethalTech = roll.lethalTech;
  if (roll.criticalRay != 0) chatCriticalRay = roll.criticalRay;
  if (roll.pharmTool != 0) chatPharmTool = roll.pharmTool;
  if (roll.powup != 0) chatPowup = roll.powup;
  if (roll.rollCount > 0) chatExtraRoll = roll.rollCount;
  if (roll.fumble == 1) chatFumble = roll.fumble;

  let showhalf = true;
  let shownoc = true;
  if (roll.halfPow == 1) {
    showhalf = false;
    shownoc = false;
  }
  if (roll.cValue == 100 || chatExtraRoll == null) shownoc = false;

  return {
    formula: chatFormula,
    power: chatPower,
    lethalTech: chatLethalTech,
    criticalRay: chatCriticalRay,
    pharmTool: chatPharmTool,
    powup: chatPowup,
    result: chatResult,
    mod: chatMod,
    modTotal: chatModTotal,
    half: chatHalf,
    results: chatResults,
    total: chatTotal,
    extraRoll: chatExtraRoll,
    fumble: chatFumble,
    showhalf,
    shownoc,
  };
}
