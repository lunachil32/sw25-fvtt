import { waitForDialog } from "./prompt.mjs";

/** Collect a phasearea cost without applying effects or saving resources. */
export async function showPhaseareaCostDialog({ name, minimum, maximum }, onSubmit) {
  const title = game.i18n.localize("SW25.InputPhaseareaPoint");
  const cost = await waitForDialog({
    title: `${title} (${name})`,
    content: `
      <div class="form-group"><label>${title} (${minimum}-${maximum})</label></div>
      <div class="form-group"><input name="number" type="number" value="0" /></div>
    `,
    buttons: [
      {
        action: "ok", label: game.i18n.localize("SW25.Use"), default: true,
        callback: root => {
          const value = parseInt(root.querySelector('[name="number"]').value);
          if (isNaN(value)) {
            ui.notifications.error(game.i18n.localize("SW25.Item.Spell.Cancel"));
            return null;
          }
          return value;
        },
      },
      { action: "cancel", label: game.i18n.localize("SW25.Item.Spell.Cancel") },
    ],
  });
  if (cost !== null) return onSubmit(cost);
}
