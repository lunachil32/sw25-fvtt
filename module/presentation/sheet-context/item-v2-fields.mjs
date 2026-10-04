/** Field metadata for V2 item editors; calculations remain in the Item document. */
export function prepareItemV2Fields(item) {
  const definitions = [...common, ...(fieldsByType[item.type] ?? [])];
  if (item.type === "resource") {
    const subtype = subtypes[item.system.resource?.type];
    if (subtype) definitions.push(...subtype);
  }
  if (item.type === "spell") {
    definitions.push(...(spellSubtypes[item.system.type] ?? []));
  }
  const options = item.type === "action" ? {
    actionSlots: Object.fromEntries([["f1", "Fellow", "1-2"], ["f3", "Fellow", "3-4"], ["f5", "Fellow", "5"], ["f6", "Fellow", "6"], ["d1", "Daemon", "1"], ["d2", "Daemon", "2-3"], ["d4", "Daemon", "4-5"], ["d6", "Daemon", "6"]].map(([key, type, range]) => [key, game.i18n.localize("SW25." + type) + ": " + range])),
    actionResults: Object.fromEntries((actionResults[item.system.actiondice] ?? []).map(value => [value, value])),
  } : {};
  return prepareFields(item, definitions, options);
}

/** Group editable roll configuration without duplicating document calculations. */
export function prepareItemV2FieldGroups(item, context) {
  const groups = [{ label: "SW25.Details", fields: prepareItemV2Fields(item) }];
  if (item.type === "session") {
    for (const [section, definitions] of Object.entries(sessionFields)) {
      groups.push({ label: "SW25.Item.Session." + section, fields: prepareFields(item, definitions) });
    }
  }
  if (["weapon", "armor", "accessory", "item", "spell", "combatability", "raceability", "check", "enhancearts", "ridingtrick", "alchemytech", "magicalsong", "phasearea", "tactics", "infusion", "barbarousskill", "essenceweave", "otherfeature", "action"].includes(item.type)) {
    const options = { ...context, skills: { adv: game.i18n.localize("SW25.Attributes.Advlevel"), ...Object.fromEntries((Array.isArray(item.system.skilllist) ? item.system.skilllist : []).map(skill => [skill.name, skill.name])) } };
    options.resources = Object.fromEntries((Array.isArray(item.system.itemlist) ? item.system.itemlist : []).map(resource => [resource.itemId, resource.itemName]));
    if (!["item", "check"].includes(item.type)) groups.push({ label: "SW25.Item.Field.Resource", fields: prepareFields(item, costs, options) });
    if (item.type === "action") {
      const actionCheck = check.filter(([name]) => name !== "system.clickitem").map(([name, ...definition]) => [name + "1", ...definition]);
      groups.push({ label: "SW25.Item.Action.ActionValue", fields: prepareFields(item, actionCheck, options) });
    }
    groups.push({ label: "SW25.Check", fields: prepareFields(item, item.type === "check" ? checkItem : check, options) });
    groups.push({ label: "SW25.Item.Power", fields: prepareFields(item, item.type === "check" ? power.filter(([name]) => !["system.usepower", "system.powerskill", "system.powerabi", "system.powermod"].includes(name)) : power, options) });
    groups.push({ label: "SW25.Item.Powertable", fields: prepareFields(item, Array.from({ length: 10 }, (_, index) => ["system.pt" + (index + 3), String(index + 3), "number"])) });
  }
  if (item.type === "magicalsong") {
    for (const [suffix, label] of [["get", "SW25.Item.Magicalsong.Get"], ["add", "SW25.Adding"], ["cond", "SW25.Condition"], ["cost", "SW25.Item.Magicalsong.Cost"]]) {
      groups.push({ label, fields: prepareFields(item, ["up", "down", "charm"].map(type => ["system." + type + suffix, CONFIG.SW25.noteTypes[type], "number"])) });
    }
  }
  return groups;
}

function prepareFields(item, definitions, context = {}) {
  return definitions.map(([name, label, type = "text", options]) => ({
    name, label, type, value: foundry.utils.getProperty(item, name),
    options: options ? context[options] ?? CONFIG.SW25[options] : null,
    localizeOptions: !["skills", "resources", "actionSlots", "actionResults"].includes(options),
    checkbox: type === "checkbox", select: type === "select", textarea: type === "textarea",
    dtype: type === "number" ? "Number" : type === "checkbox" ? "Boolean" : "String",
  }));
}

export const supportedItemTypesV2 = ["skill", "resource", "armor", "weapon", "accessory", "item", "spell", "combatability", "raceability", "language", "check", "enhancearts", "ridingtrick", "alchemytech", "magicalsong", "phasearea", "tactics", "infusion", "barbarousskill", "essenceweave", "otherfeature", "session", "action"];

const common = [["name", "Name"], ["system.overview", "SW25.Item.Overview"]];
const skill = [
  ["system.skilllevel", "SW25.Item.Skill.Skilllevel", "number"],
  ["system.skillmod", "SW25.Modifier", "number"],
  ["system.exptable", "SW25.Item.Skill.Exptable", "select", "exptables"],
  ["system.skilltype", "SW25.Item.Skill.Skilltype", "select", "skillTypes"],
  ["system.dedicated", "SW25.Item.Invoker", "checkbox"],
];
const resource = [
  ["system.quantity", "SW25.Quantity", "number"],
  ["system.qmin", "SW25.Min", "number"],
  ["system.qmax", "SW25.Max", "number"],
  ["system.price", "SW25.Item.Price", "number"],
  ["system.resource.type", "SW25.Item.Resource.Type", "select", "resourceTypes"],
  ["system.resource.isNotBattle", "SW25.Item.Resource.Battle", "checkbox"],
  ["system.selfbuff", "SW25.Item.Selfbuff", "checkbox"],
];
const subtypes = {
  note: [["system.resource.notetype", "SW25.V2.ResourceSubtype", "select", "noteTypes"]],
  material: [
    ["system.resource.materialtype", "SW25.V2.ResourceSubtype", "select", "materialTypes"],
    ["system.resource.materialrank", "SW25.Attributes.Honer.Rank", "select", "materialRanks"],
  ],
  lifeline: [["system.resource.lifelinetype", "SW25.V2.ResourceSubtype", "select", "phaseareaTypes"]],
  magitech: [["system.resource.magitechtype", "SW25.V2.ResourceSubtype", "select", "magitechTypes"]],
  abyssex: [["system.resource.abyssextype", "SW25.V2.ResourceSubtype", "select", "abyssexTypes"]],
};

const goods = [
  ["system.quantity", "SW25.Quantity", "number"],
  ["system.price", "SW25.Item.Price", "number"],
  ["system.isMagicitem", "SW25.Item.MagicItem", "checkbox"],
  ["system.isHonoritem", "SW25.Item.HonorItem", "checkbox"],
  ["system.honor", "SW25.Item.Honor", "number"],
  ["system.info.popularity", "SW25.Item.Popularity"],
  ["system.info.shape", "SW25.Item.Shape"],
  ["system.info.create", "SW25.Item.Create"],
  ["system.selfbuff", "SW25.Item.Selfbuff", "checkbox"],
];
const wearable = [
  ...goods,
  ["system.equip", "SW25.Equip", "checkbox"],
  ["system.dedicated", "SW25.Item.Dedicated", "checkbox"],
];
const equipment = [
  ...wearable,
  ["system.rank", "SW25.Attributes.Honer.Rank", "select", "ranks"],
  ["system.usage", "SW25.Item.Weapon.Usage", "select", "weaponUsages"],
  ["system.reqstr", "SW25.Item.Reqstr", "number"],
];
const armor = [
  ...equipment,
  ["system.category", "SW25.Item.Category", "select", "armorCategorys"],
  ["system.dodge", "SW25.Item.Armor.Dodge", "number"],
  ["system.pp", "SW25.Attributes.Protectionpoint.long", "number"],
  ["system.mpp", "SW25.Attributes.Magicprotection.abbr", "number"],
];
const weapon = [
  ...equipment,
  ["system.category", "SW25.Item.Category", "select", "weaponCategories"],
  ["system.type", "SW25.Item.Weapon.Type", "select", "weaponTypes"],
  ["system.hit", "SW25.Item.Weapon.Hit", "number"],
  ["system.dmod", "SW25.Item.Weapon.Dmod", "number"],
  ["system.range", "SW25.Item.Weapon.Range"],
];
const accessory = [
  ...wearable,
  ["system.accpart", "SW25.Item.Accessory.Part", "select", "accparts"],
  ["system.deffect", "SW25.Item.Dedicated", "select", "deffects"],
];
const item = [
  ...goods,
  ["system.type", "SW25.Item.Category", "select", "itemTypes"],
  ["system.info.category", "SW25.Item.Category"],
];
const spell = [
  ["system.equip", "SW25.Equip", "checkbox"],
  ["system.selfbuff", "SW25.Item.Selfbuff", "checkbox"],
  ["system.level", "SW25.Level", "number"],
  ["system.type", "SW25.Item.Category", "select", "spellTypes"],
  ["system.target", "SW25.Target"],
  ["system.rangeshape", "SW25.Rangeshape"],
  ["system.time", "SW25.Time"],
  ["system.prop", "SW25.Item.Prop", "select", "spellProps"],
  ["system.aux", "SW25.Item.Aux", "checkbox"],
  ["system.prep", "SW25.Item.Prep", "checkbox"],
  ["system.resistinfo.type", "SW25.Item.Resisttype", "select", "resistCheck"],
  ["system.resistinfo.input", "SW25.Item.Resisttype"],
  ["system.resistinfo.result", "SW25.Item.Resist", "select", "resistResult"],
];
const spellSubtypes = {
  priest: [
    ["system.faith", "SW25.Item.Spell.Faith", "select", "faiths"],
    ["system.sect", "SW25.Item.Spell.Specialpriest"],
  ],
  magitech: [["system.magispfere", "SW25.Item.Spell.Magispfere"]],
  fairy: [
    ["system.fairytype", "SW25.Item.Spell.Fairytype", "select", "fairyTypes"],
    ["system.fairyprop", "SW25.Item.Spell.Fairyprop", "select", "fairyProps"],
  ],
  abyssal: [1, 2].flatMap(index => [
    ["system.excost" + index, "SW25.Item.Spell.ExCost"],
    ["system.extime" + index, "SW25.Item.Spell.ExTime"],
    ["system.expansion" + index, "SW25.Item.Spell.Expansion", "textarea"],
  ]),
};
const feature = [
  ["system.equip", "SW25.Item.Activation", "checkbox"],
  ["system.selfbuff", "SW25.Item.Selfbuff", "checkbox"],
  ["system.aux", "SW25.Item.Aux", "checkbox"],
  ["system.prep", "SW25.Item.Prep", "checkbox"],
  ["system.resistinfo.type", "SW25.Item.Resisttype", "select", "resistCheck"],
  ["system.resistinfo.input", "SW25.Item.Resisttype"],
  ["system.resistinfo.result", "SW25.Item.Resist", "select", "resistResult"],
];
const combatability = [
  ...feature,
  ["system.type", "SW25.Item.Combatability.Type", "select", "combatabilityTypes"],
  ["system.vag", "SW25.Item.Combatability.Vag", "checkbox"],
  ["system.dancer", "SW25.Item.Combatability.Dancer", "checkbox"],
  ["system.condtype", "SW25.Condition", "select", "combatabilityCondTypes"],
  ["system.cond", "SW25.Condition"],
  ["system.use", "SW25.Item.Combatability.Use"],
  ["system.app", "SW25.Item.Combatability.App"],
  ["system.risk", "SW25.Item.Combatability.Risk"],
  ["system.secret", "SW25.Item.Combatability.Secret", "checkbox"],
  ["system.school", "SW25.Item.Combatability.Scholl"],
  ["system.honercost", "SW25.Item.Combatability.Honercost", "number"],
  ["system.sectype", "SW25.Item.Combatability.Sectype"],
  ["system.limcond", "SW25.Item.Combatability.Limcond"],
];
const raceability = [
  ...feature,
  ["system.level", "SW25.Level", "number"],
  ["system.race", "SW25.Race"],
  ["system.target", "SW25.Target"],
  ["system.rangeshape", "SW25.Rangeshape"],
  ["system.time", "SW25.Time"],
  ["system.prop", "SW25.Item.Prop", "select", "spellProps"],
  ["system.constant", "SW25.Item.Constant", "checkbox"],
  ["system.main", "SW25.Item.Main", "checkbox"],
  ["system.decla", "SW25.Item.Declaabbr", "checkbox"],
];
const language = [
  ["system.conversation", "SW25.Item.Language.Conversation", "checkbox"],
  ["system.reading", "SW25.Item.Language.Reading", "checkbox"],
];
const technique = [
  ...feature,
  ["system.level", "SW25.Level", "number"],
  ["system.constant", "SW25.Item.Constant", "checkbox"],
  ["system.main", "SW25.Item.Main", "checkbox"],
  ["system.decla", "SW25.Item.Declaabbr", "checkbox"],
];
const enhancearts = [...technique, ["system.time", "SW25.Time"]];
const ridingtrick = [
  ...technique,
  ["system.premise", "SW25.Item.Premise"],
  ["system.support", "SW25.Item.Ridingtrick.Support"],
  ["system.rtpart", "SW25.Item.Part"],
];
const alchemytech = [
  ...technique,
  ["system.target", "SW25.Target"],
  ["system.rangeshape", "SW25.Rangeshape"],
  ["system.time", "SW25.Time"],
  ...["red", "green", "black", "white", "gold"].map(color => ["system." + color, "SW25.Item.Alchemytech." + color[0].toUpperCase() + color.slice(1), "number"]),
  ["system.effectvalue.type", "SW25.Item.Alchemytech.EffectiveValue", "select", "alchemyEffecive"],
  ...["b", "a", "s", "ss"].map(rank => ["system.effectvalue." + rank, "SW25.Item.Alchemytech." + rank.toUpperCase(), "number"]),
];
const magicalsong = [
  ...technique,
  ["system.type", "SW25.Item.Prop", "select", "magicalsongTypes"],
  ["system.prop", "SW25.Item.Prop", "select", "magicalsongProps"],
  ["system.sing", "SW25.Item.Magicalsong.Sing", "checkbox"],
  ["system.pet", "SW25.Item.Magicalsong.Pet"],
  ["system.singpoint", "SW25.Item.Magicalsong.Singpoint", "number"],
];
const phasearea = [
  ...technique,
  ["system.type", "SW25.Item.Prop", "select", "phaseareaTypes"],
  ["system.prop", "SW25.Item.Prop", "select", "phaseareaProps"],
  ["system.time", "SW25.Time"],
  ["system.mincost", "SW25.Min", "number"],
  ["system.maxcost", "SW25.Max", "number"],
];
const tactics = [
  ...technique,
  ["system.type", "SW25.Item.Prop", "select", "tacticsTypes"],
  ["system.line", "SW25.Item.Tactics.Line", "select", "tacticsLines"],
  ["system.rank", "SW25.Item.Tactics.Rank", "number"],
  ["system.cond", "SW25.Condition"],
  ["system.premise", "SW25.Item.Premise"],
  ["system.get", "SW25.Item.Tactics.Get", "number"],
  ["system.cost", "SW25.Cost", "number"],
];
const rangedFeature = [
  ...technique,
  ["system.target", "SW25.Target"],
  ["system.rangeshape", "SW25.Rangeshape"],
  ["system.time", "SW25.Time"],
  ["system.prop", "SW25.Item.Prop", "select", "spellProps"],
];
const infusion = [
  ...technique,
  ["system.type", "SW25.Item.Prop", "select", "infusionTypes"],
  ["system.race", "SW25.Race"],
  ["system.premise", "SW25.Item.Premise"],
  ["system.itpart", "SW25.Item.Part"],
  ["system.humanoid", "SW25.Item.Infusion.HumanoidForm", "checkbox"],
];
const barbarousskill = [...rangedFeature, ["system.race", "SW25.Race"], ["system.rank", "SW25.Item.BarbarousSkill.Rank", "select", "ranks"]];
const essenceweave = [...rangedFeature, ["system.premise", "SW25.Item.Premise"]];
const otherfeature = [...rangedFeature, ["system.type", "SW25.Item.Prop"]];
const action = [
  ...feature.filter(([name]) => name.startsWith("system.resistinfo.")),
  ["system.actiondice", "SW25.ActionTable", "select", "actionSlots"],
  ["system.actionresult", "SW25.Item.Action.ActionResult", "select", "actionResults"],
  ["system.target", "SW25.Target"],
  ["system.dialog", "SW25.Item.Action.Dialog"],
  ["system.action", "SW25.Item.Action.Action", "textarea"],
  ["system.actioneffect", "SW25.Item.Action.ActionEffect", "textarea"],
];
const actionResults = { f1: [7, 6], f3: [8, 5], f5: [9, 4], f6: [10, 3], d1: [8], d2: [8], d4: [9], d6: [10] };
const fieldsByType = { action, skill, resource, armor, weapon, accessory, item, spell, combatability, raceability, language, enhancearts, ridingtrick, alchemytech, magicalsong, phasearea, tactics, infusion, barbarousskill, essenceweave, otherfeature };

const check = [
  ["system.clickitem", "SW25.Item.Clickitem", "select", "clickitemOptions"],
  ["system.usedice", "SW25.Item.Usedice", "checkbox"],
  ["system.checkskill", "SW25.Skillname", "select", "skills"],
  ["system.checkabi", "SW25.Abilityname", "select", "abilities"],
  ["system.checkmod", "SW25.Modifier", "number"],
  ["system.applycheck", "SW25.Item.applyon", "select", "applyOptions"],
  ["system.customdice", "SW25.Item.Customdice", "checkbox"],
  ["system.customformula", "SW25.Item.Formula"],
  ...["pd", "md", "cd", "hr", "mr"].map(type => ["system.ck" + type + "bt", "SW25.Item." + type, "checkbox"]),
];
const checkItem = [
  ["system.checkmethod", "SW25.Check", "select", "checkmethodOptions"],
  ["system.checkpackage", "SW25.Item.Check.Package", "select", "checkpackages"],
  ["system.showbtcheck", "SW25.Battle", "checkbox"],
  ["system.checkfixmod", "SW25.Fixmodifier", "number"],
  ...check.filter(([name]) => !["system.clickitem", "system.usedice", "system.customdice"].includes(name)),
  ...feature.filter(([name]) => name.startsWith("system.resistinfo.")),
];
const power = [
  ["system.usepower", "SW25.Item.Usepower", "checkbox"],
  ["system.powerskill", "SW25.Skillname", "select", "skills"],
  ["system.powerabi", "SW25.Abilityname", "select", "abilities"],
  ["system.powermod", "SW25.Modifier", "number"],
  ["system.power", "SW25.Item.Power", "number"],
  ["system.cvalue", "SW25.Item.Cvalue", "number"],
  ["system.halfpow", "SW25.Item.Halfpow", "checkbox"],
  ["system.applypower", "SW25.Item.applyon", "select", "applyOptions"],
  ...["pd", "md", "cd", "hr", "mr"].map(type => ["system.pw" + type + "bt", "SW25.Item." + type, "checkbox"]),
  ["system.halfpowmod", "SW25.Item.Halfpowmod", "number"],
  ["system.lethaltech", "SW25.Item.Lethaltech", "number"],
  ["system.criticalray", "SW25.Item.Criticalray"],
  ["system.pharmtool", "SW25.Item.Pharmtool", "number"],
  ["system.powup", "SW25.Item.Powup", "number"],
];

const costs = [
  ["system.basehpcost", "SW25.Item.Hpcost"],
  ["system.maxhpcost", "SW25.Max", "number"],
  ["system.basempcost", "SW25.Item.Mpcost", "number"],
  ["system.resuse", "SW25.Item.Resuse", "select", "resources"],
  ["system.resusequantity", "SW25.Item.Resquantity", "number"],
  ["system.autouseres", "SW25.Item.AutoUseres", "checkbox"],
];

const sessionFields = {
  OutputResult: [["basic", "BasicResult"], ["sword", "SwordResult"], ["character", "CharaResult"], ["custom", "CustomResult"]].map(([key, label]) => ["system.result." + key, "SW25.Item.Session." + label, "checkbox"]),
  Information: [
    ["system.session.date", "SW25.Item.Session.Date"],
    ["system.session.gamemaster", "SW25.Item.Session.GM"],
    ["system.session.player", "SW25.Item.Session.Player"],
    ["system.session.pcnum", "SW25.Item.Session.PC", "number"],
  ],
  Mission: [["exp", "Exp"], ["gamel", "Gamel"], ["honor", "Honor"]].map(([key, label]) => ["system.session.mission." + key, "SW25.Item.Session." + label, "number"]),
  Middle: [["exp", "Exp"], ["gamel", "Gamel"], ["sword", "Sword"], ["abyss", "Abyss"], ["tresure", "Tresure"]].map(([key, label]) => ["system.session.middle." + key, "SW25.Item.Session." + label, "number"]),
};
