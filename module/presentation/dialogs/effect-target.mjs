/** Open the effect target picker; callers decide what to do with selected tokens. */
export function showEffectTargetDialog(name, onSelect) {
  const tokens = canvas.tokens.placeables;

  if (tokens.length === 0) {
    return ui.notifications.warn(game.i18n.localize("SW25.NotTokenwarn"));
  }

  const categories = {
    friendly: [],
    neutral: [],
    hostile: [],
  };

  tokens.forEach((token) => {
    switch (token.document.disposition) {
      case 1:
        categories.friendly.push(token);
        break;
      case 0:
        categories.neutral.push(token);
        break;
      case -1:
        categories.hostile.push(token);
        break;
    }
  });

  for (const key in categories) {
    categories[key].sort((a, b) => a.name.localeCompare(b.name));
  }

  const createCategoryBox = (category, title, categoryId) => {
    let box = `<fieldset class="target-select">
      <legend id="${categoryId}-toggle" style="cursor: pointer;">
        <span class="selectable">${title}</span>
      </legend>`;
    category.forEach((token) => {
      box += `
        <div>
          <input type="checkbox" id="token-${token.id}" name="${categoryId}" value="${token.id}" />
          <label for="token-${token.id}" style="font-weight: normal;">${token.name}</label>
        </div>`;
    });
    box += `</fieldset>`;
    return box;
  };

  const content = `
    <div style="width: 100%;">
      ${createCategoryBox(
        categories.friendly,
        game.i18n.localize("SW25.Disposition.Friendly"),
        "friendly"
      )}
      ${createCategoryBox(
        categories.neutral,
        game.i18n.localize("SW25.Disposition.Neutral"),
        "neutral"
      )}
      ${createCategoryBox(
        categories.hostile,
        game.i18n.localize("SW25.Disposition.Hostile"),
        "hostile"
      )}
    </div>`;

  const dialog = new Dialog({
    title: game.i18n.localize("SW25.TargetSelect") + `(${name})`,
    content: content,
    buttons: {
      process: {
        label: game.i18n.localize("SW25.Item.EffectB"),
        callback: (html) => {
          const selectedIds = html
            .find('input[type="checkbox"]:checked')
            .map((_, el) => el.value)
            .get();

          if (selectedIds.length === 0) {
            return ui.notifications.warn(
              game.i18n.localize("SW25.Notargetwarn")
            );
          }

          const selectedTokens = canvas.tokens.placeables.filter((token) =>
            selectedIds.includes(token.id)
          );
          onSelect(selectedTokens);
        },
      },
      cancel: {
        label: game.i18n.localize("SW25.Item.Spell.Cancel"),
      },
    },
    default: "cancel",
  });

  dialog.render(true);

  Hooks.once("renderDialog", (app, html) => {
    const addToggleHandler = (categoryId) => {
      const toggle = html.find(`#${categoryId}-toggle`);
      const checkboxes = html.find(`input[name="${categoryId}"]`);

      toggle.on("click", () => {
        const allChecked = checkboxes.toArray().every((cb) => cb.checked);
        checkboxes.prop("checked", !allChecked).trigger("change");
      });

      checkboxes.on("change", (event) => {
        const checkbox = $(event.currentTarget);
        const label = checkbox.next("label");
        label.css("font-weight", checkbox.is(":checked") ? "bold" : "normal");
      });
    };

    addToggleHandler("friendly");
    addToggleHandler("neutral");
    addToggleHandler("hostile");

    html[0].style.width = "500px";
  });
}
