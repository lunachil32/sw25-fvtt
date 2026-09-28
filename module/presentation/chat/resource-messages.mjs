/** Present a completed operation as chat without depending on a sheet. */
export async function postAlchemyCost(actor, itemName, rankLabel, results) {
  const marks = {
    red: "fa-paw",
    green: "fa-leaf",
    black: "fa-gem",
    white: "fa-heart",
    gold: "fa-sun",
  };
  const name = `${itemName}(${rankLabel})`;
  const materialcards = results.map((card) => ({
    key: card.cost,
    name:
      game.i18n.localize(`SW25.Item.Alchemytech.${card.color.capitalize()}`) +
      rankLabel,
    color: card.color,
    ...(card.resource ? { mark: marks[card.color] } : {}),
    cost: card.cost,
    resource: card.resource,
    oldVal: card.previousQuantity,
    newVal: card.remainingQuantity,
  }));

  // Chat message
  const speaker = ChatMessage.getSpeaker({ actor: actor });
  let label =
    game.i18n.localize("SW25.Item.Alchemytech.MaterialCard") +
    game.i18n.localize("SW25.Cost");

  let chatData = {
    speaker: speaker,
    flavor: label,
  };
  chatData.content = await renderTemplate(
    "systems/sw25-lunachil-maintained/templates/roll/card-apply.hbs",
    {
      name: name,
      materialcards: materialcards,
    }
  );

  ChatMessage.create(chatData);
}

/** Post a completed standalone resource consumption. */
export function postResourceCost(speaker, name, result) {
  ChatMessage.create({
    speaker,
    content: `<div style="text-align: right;">${name}: ${result.previousQuantity} >>> ${result.remainingQuantity}</div>`,
  });
}
