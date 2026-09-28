/** Collect a phasearea cost without applying effects or saving resources. */
export function showPhaseareaCostDialog({ name, minimum, maximum }, onSubmit) {
  const title = game.i18n.localize("SW25.InputPhaseareaPoint");
  new Dialog({
    title: `${title} (${name})`,
    content: `
      <form>
        <div class="form-group">
          <label for="number">${title} (${minimum}-${maximum})</label>
        </div>
        <div class="form-group">
          <input id="number" name="number" type="number" value="0" />
        </div>
      </form>
    `,
    buttons: {
      ok: {
        label: game.i18n.localize("SW25.Use"),
        callback: (html) => {
          const cost = parseInt(html.find("#number").val());
          if (isNaN(cost)) {
            ui.notifications.error(
              game.i18n.localize("SW25.Item.Spell.Cancel")
            );
            return;
          }
          onSubmit(cost);
        },
      },
      cancel: {
        label: game.i18n.localize("SW25.Item.Spell.Cancel"),
      },
    },
    default: "ok",
  }).render(true);
}
