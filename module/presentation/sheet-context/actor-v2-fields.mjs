/** Describe editable PC fields without duplicating Actor calculations. */
export function prepareActorV2Fields(data) {
  return {
    profileFields: fields(profile, data),
    vitalFields: fields(vitals, data),
    baseFields: fields(bases, data),
  };
}

function fields(definitions, data) {
  return definitions.map(([name, label, type = "text"]) => ({
    name, label, type, value: foundry.utils.getProperty(data, name),
    dtype: type === "number" ? "Number" : "String",
  }));
}

const profile = [
  ["name", "SW25.CharacterName"],
  ["system.race", "SW25.Race"],
  ["system.attributes.gender", "SW25.Attributes.Gender"],
  ["system.attributes.age", "SW25.Attributes.Age", "number"],
  ["system.attributes.born", "SW25.Attributes.Born"],
  ["system.attributes.faith", "SW25.Attributes.Faith"],
  ["system.attributes.honer.rank", "SW25.Attributes.Honer.Rank"],
  ["system.attributes.honer.value", "SW25.Attributes.Honer.Label", "number"],
  ["system.attributes.impurity", "SW25.Attributes.Impurity", "number"],
  ["system.attributes.totalexp", "SW25.V2.TotalExperience", "number"],
  ["system.attributes.fumble", "SW25.Attributes.Fumble", "number"],
  ["system.money", "SW25.V2.Money", "number"],
];
const vitals = [
  ["system.hp.value", "SW25.Hp", "number"],
  ["system.mp.value", "SW25.Mp", "number"],
  ["system.hp.hpmod", "SW25.V2.HpModifier", "number"],
  ["system.mp.mpmod", "SW25.V2.MpModifier", "number"],
];
const bases = [
  ["system.abilities.dex.racevalue", "SW25.V2.SkillBase", "number"],
  ["system.abilities.str.racevalue", "SW25.V2.BodyBase", "number"],
  ["system.abilities.int.racevalue", "SW25.V2.MindBase", "number"],
];
