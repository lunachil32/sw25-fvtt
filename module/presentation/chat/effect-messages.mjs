/** Present a completed operation as chat without depending on a sheet. */
export async function postAppliedEffects(actor, targetNames, effectNames) {
  // Chat message
  const speaker = ChatMessage.getSpeaker({ actor: actor });
  let label = game.i18n.localize("SW25.Effectslong");
  let chatActorName = "";
  let chatEffectName = "";

  for (let i = 0; i < targetNames.length; i++) {
    chatActorName += ">>> " + targetNames[i] + "<br>";
  }
  for (let i = 0; i < effectNames.length; i++) {
    chatEffectName += effectNames[i] + "<br>";
  }

  let chatData = {
    speaker: speaker,
    flavor: label,
  };
  chatData.content = await renderTemplate(
    "systems/sw25-lunachil-maintained/templates/roll/effect-apply.hbs",
    {
      targetActorName: chatActorName,
      transferEffectName: chatEffectName,
    }
  );

  ChatMessage.create(chatData);
}

/** Describe the applied phasearea and its lifeline. */
export async function postPhaseareaEffect(actor, targetName, effectName, lifeline) {
  // Chat message
  const speaker = ChatMessage.getSpeaker({ actor: actor });
  let label = game.i18n.localize("SW25.Effectslong");
  let chatActorName = ">>> " + targetName + "<br>";
  let chatEffectName =
    effectName +
    "(" +
    game.i18n.localize(`SW25.Item.Phasearea.${lifeline}`) +
    ")<br>";

  let chatData = {
    speaker: speaker,
    flavor: label,
  };
  chatData.content = await renderTemplate(
    "systems/sw25-lunachil-maintained/templates/roll/effect-apply.hbs",
    {
      targetActorName: chatActorName,
      transferEffectName: chatEffectName,
    }
  );

  ChatMessage.create(chatData);
}
