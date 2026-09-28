/** Present a completed operation as chat without depending on a sheet. */
export async function postActorCheck(actor, dataset, result, targetTokens) {
  const { roll, resourceCost, critical, fumble, elements, damage, tags } = result;
  const checktype = dataset.checktype ? dataset.checktype.split(",") : "";
  const label = dataset.label ? `${dataset.label}` : "";
  const chatresuse = resourceCost
    ? `<div style="text-align: right;">${resourceCost.name}: ${resourceCost.previousQuantity} >>> ${resourceCost.remainingQuantity}</div>`
    : undefined;

  let chatData = {
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: label,
    rollMode: game.settings.get("core", "rollMode"),
    rolls: [roll],
  };

  let chatapply = dataset.apply;
  let chatspell = dataset.spell;

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

  let resistData = null;
  if (dataset.resist && dataset.resistresult != "none") {
    resistData = {
      name: dataset.resist,
      result: dataset.resistresult,
    };
  }

  chatData.flags = {
    sw25: {
      total: roll.total,
      orgtotal: roll.total,
      formula: roll.formula,
      rolls: roll,
      tooltip: await roll.getTooltip(),
      apply: chatapply,
      spell: chatspell,
      checktype: checktype,
      target,
      targetName: targetName,
      resist: resistData,
      elements: elements,
      damage: damage,
      tags: tags,
    },
  };

  chatData.content = await renderTemplate(
    "systems/sw25-lunachil-maintained/templates/roll/roll-check.hbs",
    {
      formula: roll.formula,
      tooltip: await roll.getTooltip(),
      critical,
      fumble,
      total: roll.total,
      apply: chatapply,
      spell: chatspell,
      checktype: checktype,
      resusetext: chatresuse,
      targetName: targetName,
      resist: resistData,
      tags: tags,
    }
  );

  let chatMessageId;
  await ChatMessage.create(chatData).then((chatMessage) => {
    chatMessageId = chatMessage.id;
  });

  return { roll, chatMessageId };
}
