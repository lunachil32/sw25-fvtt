/** Present a completed operation as chat without depending on a sheet. */
export async function postSessionResult({ roll, result }, label) {
  const chatData = {
    speaker: ChatMessage.getSpeaker(),
    flavor: label,
  };
  if (roll) chatData.rolls = [roll];

  chatData.content = await renderTemplate(
    "systems/sw25-lunachil-maintained/templates/roll/session-info.hbs",
    result
  );

  ChatMessage.create(chatData);
}
