import { preparePowerRollDetails } from "./power-details.mjs";

/** Present a completed operation as chat without depending on a sheet. */
export async function postActorPower(actor, dataset, { roll, elements, damage, tags }, targetTokens) {
  const details = preparePowerRollDetails(roll);
  const powertype = dataset.powertype ? dataset.powertype.split(",") : "";
  const chatData = {
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: `${dataset.label}`,
    rollMode: game.settings.get("core", "rollMode"),
    rolls: [roll.fakeResult],
  };
  const chatapply = dataset.apply;

  // when selected target
  let target = null;
  let targetName = null;
  if (targetTokens) {
    const targetArray = Array.from(targetTokens);
    target = targetArray.map((target) => target.id);
    let targetNames = targetArray.map((target) => target.document.name);
    targetName = ``;
    for (let i = 0; i < targetNames.length; i++) {
      if (i != 0) targetName = targetName + `<br>`;
      targetName = targetName + `>>> ${targetNames[i]}`;
    }
    targetName = targetName + ``;
  }

  chatData.flags = {
    sw25: {
      ...details,
      tooltip: await roll.fakeResult.getTooltip(),
      orghalf: roll.halfPowMod,
      orgtotal: details.total,
      orgextraRoll: details.extraRoll,
      apply: chatapply,
      powertype,
      target,
      targetName,
      elements,
      damage,
      tags,
    },
  };

  const { modTotal, ...display } = details;
  chatData.content = await renderTemplate(
    "systems/sw25-lunachil-maintained/templates/roll/roll-power.hbs",
    {
      ...display,
      tooltip: await roll.fakeResult.getTooltip(),
      mod: modTotal,
      apply: chatapply,
      powertype,
      targetName,
      tags,
    }
  );

  let chatMessageId;
  await ChatMessage.create(chatData).then((chatMessage) => {
    chatMessageId = chatMessage.id;
  });
  return { roll, chatMessageId };
}
