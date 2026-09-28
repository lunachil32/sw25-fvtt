import { prepareActorV2Fields } from "../sheet-context/actor-v2-fields.mjs";
import { resolveActorCheck } from "../../use-cases/actor-checks.mjs";
import { postActorCheck } from "../chat/check-roll.mjs";
import { editItemField, prepareItemFieldAdjustment, saveItemFieldAdjustment } from "../../use-cases/edit-item-field.mjs";
import { prepareActorSheetContext } from "../sheet-context/actor-context.mjs";

/** Optional, minimal PC sheet for exercising the shared presentation and use-cases. */
export class SW25ActorSheetV2 extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["sw25-actor-v2"],
    tag: "form",
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      adjustResource: SW25ActorSheetV2._onAdjustResource,
      rollBasicCheck: SW25ActorSheetV2._onRollBasicCheck,
    },
    position: { width: 700, height: 760 },
    window: { resizable: true },
    viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
  };

  static PARTS = {
    profile: { template: "systems/sw25-lunachil-maintained/templates/actor/v2/profile.hbs" },
    overview: { template: "systems/sw25-lunachil-maintained/templates/actor/v2/overview.hbs" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const data = this.actor.toObject(false);
    context.resourceItems = data.items.filter(item => item.type === "resource");
    return prepareActorSheetContext(this.actor, {
      ...context, ...prepareActorV2Fields(data), actor: this.actor, data, items: data.items,
    });
  }

  _onChangeForm(formConfig, event) {
    if (event.target.matches("[data-resource-quantity]")) {
      return this._onResourceChange({ currentTarget: event.target });
    }
    return super._onChangeForm(formConfig, event);
  }

  _processFormData(event, form, formData) {
    // A single field change must not overwrite other prepared or concurrently updated values.
    const name = event?.type === "change" ? event.target.name : null;
    if (name) return foundry.utils.expandObject({ [name]: formData.object[name] });
    return super._processFormData(event, form, formData);
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

  static async _onRollBasicCheck() {
    if (!this.isEditable) return;
    const result = await resolveActorCheck(this.actor, { formula: "2d6" });
    return postActorCheck(this.actor, { label: game.i18n.localize("SW25.V2.BasicCheck") }, result);
  }
}
