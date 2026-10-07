import { waitForDialog } from "./prompt.mjs";

/** Collect a roll request without sending chat messages. */
export async function showRollRequestDialog(choices) {
  const render = game.release.generation >= 13 ? foundry.applications.handlebars.renderTemplate : renderTemplate;
  const context = { ...choices, idPrefix: foundry.utils.randomID() };
  const template = "systems/sw25-lunachil-maintained/templates/roll/rollreq-dialog.hbs";
  const content = await render(template, { ...context, method: "skill", checkname: "", ability: "" });
  return waitForDialog({
    title: game.i18n.localize("SETTING.rollRequest"), content,
    buttons: [
      {
        action: "request", label: game.i18n.localize("SETTING.rollRequest"), default: true,
        callback: readRequest,
      },
      { action: "cancel", label: game.i18n.localize("Cancel") },
    ],
    render: root => activateRequestFields(root, context, template, render),
  });
}

function readRequest(root) {
  const value = name => root.querySelector(`[name="${name}"]`)?.value ?? "";
  return {
    method: root.querySelector('[name="method"]:checked').value,
    message: value("message"), checkName: value("checkname"), inputName: value("inputcheckname"),
    refAbility: value("ability"), modifier: parseInt(value("modifier"), 10), targetValue: parseInt(value("target-value"), 10),
  };
}

function activateRequestFields(root, choices, template, render) {
  let revision = 0;
  root.addEventListener("change", async event => {
    if (!["method", "checkname"].includes(event.target.name)) return;
    const currentRevision = ++revision;
    const request = readRequest(root);
    const html = await render(template, {
      ...choices, method: request.method, checkname: request.checkName, ability: request.refAbility,
    });
    if (currentRevision !== revision || !root.isConnected) return;
    const current = readRequest(root);
    const fragment = document.createElement("template");
    fragment.innerHTML = html;
    root.querySelector("[data-request-fields]").replaceChildren(...fragment.content.querySelector("[data-request-fields]").childNodes);
    for (const [name, value] of [["message", current.message], ["inputcheckname", current.inputName]]) {
      const input = root.querySelector(`[name="${name}"]`);
      if (input) input.value = value;
    }
  });
}
