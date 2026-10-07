/** Present native-DOM callbacks on both Foundry generations; closing resolves to null. */
export function waitForDialog({ title, content, buttons, render, width = 400 }) {
  if (game.release.generation >= 13) {
    return foundry.applications.api.DialogV2.wait({
      window: { title }, position: { width }, content, rejectClose: false,
      buttons: buttons.map(button => ({
        ...button,
        callback: async (_event, _button, dialog) => ({ value: await button.callback?.(dialog.element) }),
      })),
      render: (_event, dialog) => render?.(dialog.element),
    }).then(result => result?.value ?? null);
  }
  return new Promise((resolve, reject) => {
    let submitted = false;
    const dialog = new Dialog({
      title, content,
      buttons: Object.fromEntries(buttons.map(button => [button.action, {
        label: button.label,
        callback: html => {
          submitted = true;
          try { resolve(button.callback?.(html[0]) ?? null); }
          catch (error) { reject(error); }
        },
      }])),
      default: buttons.find(button => button.default)?.action ?? buttons[0].action,
      render: html => render?.(html[0]),
      close: () => { if (!submitted) resolve(null); },
    }, { width });
    dialog.render(true);
  });
}
