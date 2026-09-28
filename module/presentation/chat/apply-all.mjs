/** Present a completed operation as chat without depending on a sheet. */
export async function postApplyAll(actor, dataset, label, chatMessageIds, type) {
  const chatData = {
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `${label} - <b>${game.i18n.localize("SW25.Applyall")}</b>`,
    flags: { sw25: { targetMessage: chatMessageIds } },
  };
  chatData.content = await renderTemplate(
    "systems/sw25-lunachil-maintained/templates/roll/roll-applyall.hbs",
    { apply: dataset.apply, [type]: dataset[type] ? dataset[type].split(",") : "" }
  );
  ChatMessage.create(chatData);
}
