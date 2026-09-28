/** Field metadata for V2 item editors; calculations remain in the Item document. */
export function prepareItemV2Fields(item) {
  const definitions = [...common, ...(fieldsByType[item.type] ?? [])];
  if (item.type === "resource") {
    const subtype = subtypes[item.system.resource?.type];
    if (subtype) definitions.push(...subtype);
  }
  return definitions.map(([name, label, type = "text", options]) => ({
    name, label, type, value: foundry.utils.getProperty(item, name),
    options: options ? CONFIG.SW25[options] : null,
    checkbox: type === "checkbox", select: type === "select",
    dtype: type === "number" ? "Number" : type === "checkbox" ? "Boolean" : "String",
  }));
}

export const supportedItemTypesV2 = ["skill", "resource", "armor", "weapon"];

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

const equipment = [
  ["system.equip", "SW25.Equip", "checkbox"],
  ["system.dedicated", "SW25.Item.Dedicated", "checkbox"],
  ["system.quantity", "SW25.Quantity", "number"],
  ["system.rank", "SW25.Attributes.Honer.Rank", "select", "ranks"],
  ["system.price", "SW25.Item.Price", "number"],
  ["system.isMagicitem", "SW25.Item.MagicItem", "checkbox"],
  ["system.isHonoritem", "SW25.Item.HonorItem", "checkbox"],
  ["system.honor", "SW25.Item.Honor", "number"],
  ["system.info.popularity", "SW25.Item.Popularity"],
  ["system.info.shape", "SW25.Item.Shape"],
  ["system.info.create", "SW25.Item.Create"],
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
const fieldsByType = { skill, resource, armor, weapon };
