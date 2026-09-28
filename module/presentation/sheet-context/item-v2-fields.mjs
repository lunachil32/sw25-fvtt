/** Field metadata for V2 item editors; calculations remain in the Item document. */
export function prepareItemV2Fields(item) {
  const definitions = [...common, ...(item.type === "skill" ? skill : resource)];
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

export const supportedItemTypesV2 = ["skill", "resource"];

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
