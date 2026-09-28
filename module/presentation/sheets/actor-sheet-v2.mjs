import { editItemField, prepareItemFieldAdjustment, saveItemFieldAdjustment } from "../../use-cases/edit-item-field.mjs";
import { prepareActorSheetContext } from "../sheet-context/actor-context.mjs";

/** Optional, minimal PC sheet for exercising the shared presentation and use-cases. */
export class SW25ActorSheetV2 extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["sw25-actor-v2"],
    tag: "div",
    actions: { adjustResource: SW25ActorSheetV2._onAdjustResource },
    position: { width: 560, height: 540 },
    window: { resizable: true },
    viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
  };

  static PARTS = {
    overview: { template: "systems/sw25-lunachil-maintained/templates/actor/v2/overview.hbs" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const data = this.actor.toObject(false);
    context.resourceItems = data.items.filter(item => item.type === "resource");
    return prepareActorSheetContext(this.actor, {
      ...context, actor: this.actor, data, items: data.items,
    });
  }
  _onRender(context, options) {
    super._onRender(context, options);
    for (const input of this.element.querySelectorAll("[data-resource-quantity]")) {
      input.onchange = this._onResourceChange.bind(this);
    }
  }

  async _onResourceChange(event) {
    if (!this.isEditable) return;
    const input = event.currentTarget;
    const item = this.actor.items.get(input.closest("[data-item-id]").dataset.itemId);
    if (!item) return;
    await editItemField(item, "system.quantity", input.value, { numeric: true });
  }

  static async _onAdjustResource(event, button) {
    if (!this.isEditable) return;
    const row = button.closest("[data-item-id]");
    const item = this.actor.items.get(row.dataset.itemId);
    if (!item) return;
    const input = row.querySelector("[data-resource-quantity]");
    const result = prepareItemFieldAdjustment(item, input.value, button.dataset.adjustment, { limitQuantity: true });
    for (const limit of result.limits) {
      const key = limit === "max" ? "SW25.isAlreadyMax" : "SW25.isAlreadyMin";
      ui.notifications.warn('"' + item.name + '"' + game.i18n.localize(key));
    }
    input.value = result.value;
    // Retain the V1 button's two writes until the shared use-case is corrected separately.
    await saveItemFieldAdjustment(item, "item.system.quantity", result.value, "system.quantity");
  }
}
