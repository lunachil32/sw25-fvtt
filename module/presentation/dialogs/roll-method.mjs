import { waitForDialog } from "./prompt.mjs";

/** Preserve the caller's once/individual/cancel protocol. */
export async function targetRollDialog(targetTokens, label) {
  if (targetTokens.size === 1) return "once";
  if (targetTokens.size < 2) return;
  return await waitForDialog({
    title: label,
    content: game.i18n.localize("DIALOG.rollMethod"),
    buttons: [
      { action: "once", label: game.i18n.localize("DIALOG.once"), callback: () => "once" },
      { action: "individual", label: game.i18n.localize("DIALOG.individual"), callback: () => "individual" },
      { action: "cancel", label: game.i18n.localize("Cancel"), default: true },
    ],
  }) ?? "cancel";
}
