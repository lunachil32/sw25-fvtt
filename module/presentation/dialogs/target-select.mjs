import { waitForDialog } from "./prompt.mjs";

/** Choose visible targets for a roll or resource/effect application. */
export function targetSelectDialog(title) {
  return selectTargets({
    title: game.i18n.localize("SW25.TargetSelect") + ` : ${title}`,
    submitLabel: game.i18n.localize("OK"),
    hideHidden: true, showImages: true, selectAll: true,
  });
}

/** Both target pickers share selection mechanics while retaining their existing options. */
export async function selectTargets({ title, submitLabel, hideHidden = false, showImages = false, selectAll = false }) {
  const tokens = canvas.tokens.placeables;
  if (!tokens.length) {
    ui.notifications.warn(game.i18n.localize("SW25.NotTokenwarn"));
    return [];
  }
  const categories = [
    { id: "friendly", disposition: 1, label: "SW25.Disposition.Friendly" },
    { id: "neutral", disposition: 0, label: "SW25.Disposition.Neutral" },
    { id: "hostile", disposition: -1, label: "SW25.Disposition.Hostile" },
  ];
  const escape = value => Handlebars.escapeExpression(value ?? "");
  const prefix = foundry.utils.randomID();
  const content = (selectAll ? `<label><input type="checkbox" data-select-all><strong>${escape(game.i18n.localize("SW25.SelectAll"))}</strong></label>` : "") +
    categories.map(category => {
      const entries = tokens.filter(token => token.document.disposition === category.disposition &&
        (!hideHidden || game.user.isGM || !token.document.hidden)).sort((a, b) => a.name.localeCompare(b.name));
      return `<fieldset class="target-select">
        <legend data-category="${category.id}" style="cursor:pointer">${escape(game.i18n.localize(category.label))}</legend>
        ${entries.map(token => `<div class="${showImages ? `token-check-wrap ${category.id}-token` : ""}">
          <input id="${prefix}-${escape(token.id)}" type="checkbox" name="target" data-category="${category.id}" value="${escape(token.id)}">
          <label for="${prefix}-${escape(token.id)}">
          ${showImages ? `<img src="${escape(token.document.texture.src)}" class="token-icon">` : ""}
          ${escape(token.name)}
        </label></div>`).join("")}
      </fieldset>`;
    }).join("");
  return await waitForDialog({
    title, content, width: 500, render: activateTargetSelection,
    buttons: [
      {
        action: "process", label: submitLabel,
        callback: root => {
          const ids = new Set(Array.from(root.querySelectorAll('input[name="target"]:checked'), input => input.value));
          const selected = canvas.tokens.placeables.filter(token => ids.has(token.id));
          if (!selected.length) ui.notifications.warn(game.i18n.localize("SW25.Notargetwarn"));
          return selected;
        },
      },
      { action: "cancel", label: game.i18n.localize("Cancel"), default: true },
    ],
  }) ?? [];
}

function activateTargetSelection(root) {
  const inputs = Array.from(root.querySelectorAll('input[name="target"]'));
  const all = root.querySelector('[data-select-all]');
  const refresh = () => {
    for (const input of inputs) input.nextElementSibling.style.fontWeight = input.checked ? "bold" : "normal";
    if (all) {
      const count = inputs.filter(input => input.checked).length;
      all.checked = inputs.length > 0 && count === inputs.length;
      all.indeterminate = count > 0 && count < inputs.length;
    }
  };
  root.addEventListener("click", event => {
    const category = event.target.closest("legend[data-category]");
    if (!category) return;
    const group = inputs.filter(input => input.dataset.category === category.dataset.category);
    const checked = !group.every(input => input.checked);
    for (const input of group) input.checked = checked;
    refresh();
  });
  root.addEventListener("change", event => {
    if (event.target === all) for (const input of inputs) input.checked = all.checked;
    refresh();
  });
  refresh();
}
