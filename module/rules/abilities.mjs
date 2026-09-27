const RACE_VALUE_SOURCES = new Map([
  ["agi", "dex"],
  ["vit", "str"],
  ["mnd", "int"],
]);

/**
 * Resolve shared racial values and return only the calculated fields.
 * The caller retains ownership of the input abilities and all other fields.
 */
export function calculateAbilities(abilities) {
  return Object.fromEntries(
    Object.entries(abilities).map(([key, ability]) => {
      const source = RACE_VALUE_SOURCES.get(key) ?? key;
      const racevalue = abilities[source].racevalue;
      return [key, {
        racevalue,
        ...calculateAbility({ ...ability, racevalue }),
      }];
    })
  );
}

/**
 * Calculate an ability score and modifier without changing the input.
 * Numeric conversion and rounding follow the existing PC calculation.
 */
function calculateAbility(input) {
  const value =
    Number(input.racevalue) +
    Number(input.valuebase) +
    Number(input.valuegrowth) +
    Number(input.valuemodify) +
    Number(input.efvaluemodify);

  return {
    value,
    mod: Math.floor(value / 6) + Number(input.efmodify),
  };
}
