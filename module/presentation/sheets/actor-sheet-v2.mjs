import { manageEffectV2 } from "./effect-controls-v2.mjs";
import { rollCheckItem } from "../rolls/check-item.mjs";
import { payItemVitalCost } from "../../use-cases/item-vital-cost.mjs";
import { Util } from "../../helpers/utils.mjs";
import { createActorItem, deleteActorItem } from "../../use-cases/actor-items.mjs";
import { openItemSheetV2 } from "./item-sheet-v2.mjs";
import { supportedItemTypesV2 } from "../sheet-context/item-v2-fields.mjs";
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
      create: manageEffectV2, edit: manageEffectV2, toggle: manageEffectV2, delete: manageEffectV2,
      createItem: SW25ActorSheetV2._onCreateItem,
      payItemCost: SW25ActorSheetV2._onPayItemCost,
      useItem: SW25ActorSheetV2._onUseItem,
      editItem: SW25ActorSheetV2._onEditItem,
      deleteItem: SW25ActorSheetV2._onDeleteItem,
      adjustResource: SW25ActorSheetV2._onAdjustResource,
      rollBasicCheck: SW25ActorSheetV2._onRollBasicCheck,
    },
    position: { width: 700, height: 760 },
    window: { resizable: true },
    viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
  };

  static PARTS = {
    effects: { template: "systems/sw25-lunachil-maintained/templates/shared/v2/effects.hbs" },
    profile: { template: "systems/sw25-lunachil-maintained/templates/actor/v2/profile.hbs" },
    inventory: { template: "systems/sw25-lunachil-maintained/templates/actor/v2/inventory.hbs" },
    overview: { template: "systems/sw25-lunachil-maintained/templates/actor/v2/overview.hbs" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const data = this.actor.toObject(false);
    context.biographyHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.actor.system.biography ?? "", {
      secrets: this.actor.isOwner, rollData: this.actor.getRollData(), relativeTo: this.actor,
    });
    context.selectedItemType = this._itemType ?? supportedItemTypesV2[0];
    context.itemTypes = Object.fromEntries(supportedItemTypesV2.map(type => [type, "TYPES.Item." + type]));
    context.managedItems = data.items.filter(item => supportedItemTypesV2.includes(item.type));
    context.resourceItems = data.items.filter(item => item.type === "resource");
    return prepareActorSheetContext(this.actor, {
      ...context, ...prepareActorV2Fields(data), actor: this.actor, data, items: data.items,
    });
  }

  _onChangeForm(formConfig, event) {
    if (event.target.matches("[data-resource-quantity]")) {
      return this._onResourceChange({ currentTarget: event.target });
    }
    if (event.target.matches("[data-item-type]")) {
      this._itemType = event.target.value;
      return;
    }
    if (!event.target.name) return;
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
  static async _onCreateItem() {
    if (!this.isEditable) return;
    const type = this.element.querySelector("[data-item-type]").value;
    if (!supportedItemTypesV2.includes(type)) return;
    const item = await createActorItem(this.actor, type);
    await openItemSheetV2(item);
  }

  static async _onPayItemCost(event, button) {
    if (!this.isEditable) return;
    const itemId = button.closest("[data-item-id]").dataset.itemId;
    const tokens = await Util.getControlledActor(this.actor);
    const result = await payItemVitalCost(this.actor, itemId, button.dataset.resource, tokens);
    if (result.warning) ui.notifications.warn(game.i18n.localize(result.warning));
  }

  static async _onUseItem(event, button) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(button.closest("[data-item-id]").dataset.itemId);
    if (item?.type === "check") return rollCheckItem(this.actor, item, game.user.targets);
    if (item) return item.roll();
  }

  static async _onEditItem(event, button) {
    const item = this.actor.items.get(button.closest("[data-item-id]").dataset.itemId);
    if (item) await openItemSheetV2(item);
  }

  static async _onDeleteItem(event, button) {
    if (!this.isEditable) return;
    const itemId = button.closest("[data-item-id]").dataset.itemId;
    if (!this.actor.items.has(itemId)) return;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("SW25.V2.DeleteItem") },
      content: "<p>" + game.i18n.localize("SW25.V2.DeleteItemPrompt") + "</p>",
      rejectClose: false,
    });
    if (confirmed) await deleteActorItem(this.actor, itemId);
  }
}
