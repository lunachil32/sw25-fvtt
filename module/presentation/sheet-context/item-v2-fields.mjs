/** Field metadata for V2 item editors; calculations remain in the Item document. */
export function prepareItemV2Fields(item) {
  const definitions = [...common, ...(fieldsByType[item.type] ?? [])];
  if (item.type === "resource") {
    const subtype = subtypes[item.system.resource?.type];
    if (subtype) definitions.push(...subtype);
  }
  return prepareFields(item, definitions);
}

/** Group editable roll configuration without duplicating document calculations. */
export function prepareItemV2FieldGroups(item, context) {
  const groups = [{ label: "SW25.Details", fields: prepareItemV2Fields(item) }];
  if (["weapon", "armor", "accessory", "item"].includes(item.type)) {
    const options = { ...context, skills: { adv: game.i18n.localize("SW25.Attributes.Advlevel"), ...Object.fromEntries((item.system.skilllist ?? []).map(skill => [skill.name, skill.name])) } };
    options.resources = Object.fromEntries((item.system.itemlist ?? []).map(resource => [resource.itemId, resource.itemName]));
    if (item.type !== "item") groups.push({ label: "SW25.Item.Field.Resource", fields: prepareFields(item, costs, options) });
    groups.push({ label: "SW25.Check", fields: prepareFields(item, check, options) });
    groups.push({ label: "SW25.Item.Power", fields: prepareFields(item, power, options) });
    groups.push({ label: "SW25.Item.Powertable", fields: prepareFields(item, Array.from({ length: 10 }, (_, index) => ["system.pt" + (index + 3), String(index + 3), "number"])) });
  }
  return groups;
}

function prepareFields(item, definitions, context = {}) {
  return definitions.map(([name, label, type = "text", options]) => ({
    name, label, type, value: foundry.utils.getProperty(item, name),
    options: options ? context[options] ?? CONFIG.SW25[options] : null,
    localizeOptions: !["skills", "resources"].includes(options),
    checkbox: type === "checkbox", select: type === "select",
    dtype: type === "number" ? "Number" : type === "checkbox" ? "Boolean" : "String",
  }));
}

export const supportedItemTypesV2 = ["skill", "resource", "armor", "weapon", "accessory", "item"];

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
const fieldsByType = { skill, resource, armor, weapon, accessory, item };

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
