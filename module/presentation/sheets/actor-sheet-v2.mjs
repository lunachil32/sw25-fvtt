import { updateAllResourceQuantities } from "../../services/resource-quantity.mjs";
import { gainTacspower, spendTacspower } from "../../use-cases/tacspower.mjs";
import { showPhaseareaCostDialog } from "../dialogs/phasearea-cost.mjs";
import { usePhasearea } from "../../use-cases/use-phasearea.mjs";
import { postPhaseareaEffect } from "../chat/effect-messages.mjs";
import { gainNotes, gainAdditionalNotes, spendNotes } from "../../use-cases/notes.mjs";
import { useAlchemy } from "../../use-cases/use-alchemy.mjs";
import { postAlchemyCost } from "../chat/resource-messages.mjs";
import { applyItemEffects } from "../../use-cases/apply-item-effects.mjs";
import { targetSelectDialog } from "../../helpers/dialogs.mjs";
import { postAppliedEffects } from "../chat/effect-messages.mjs";
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
      resetResources: SW25ActorSheetV2._onResetResources,
      createItem: SW25ActorSheetV2._onCreateItem,
      useAlchemy: SW25ActorSheetV2._onUseAlchemy,
      updateNotes: SW25ActorSheetV2._onUpdateNotes,
      updateTacspower: SW25ActorSheetV2._onUpdateTacspower,
      usePhasearea: SW25ActorSheetV2._onUsePhasearea,
      applyItemEffects: SW25ActorSheetV2._onApplyItemEffects,
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

  static async _onUsePhasearea(event, button) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(button.closest("[data-item-id]").dataset.itemId);
    if (item?.type !== "phasearea") return;
    const tokens = await Util.getControlledActor(this.actor);
    if (tokens.length !== 1) {
      return ui.notifications.warn(game.i18n.localize(tokens.length ? "SW25.Multiselectwarn" : "SW25.Noselectwarn"));
    }
    const apply = async cost => {
      const currentTokens = await Util.getControlledActor(this.actor);
      if (currentTokens.length !== 1) {
        return ui.notifications.warn(game.i18n.localize(currentTokens.length ? "SW25.Multiselectwarn" : "SW25.Noselectwarn"));
      }
      const name = item.name + game.i18n.localize("SW25.Use") + " " + cost + game.i18n.localize("SW25.Item.Phasearea.Point");
      const { effects, consumed } = await usePhasearea(this.actor, item, cost, name, currentTokens);
      const lifeline = { ten: "Ten", chi: "Chi", jin: "Jin" }[item.system.type] ?? "";
      if (!consumed) ui.notifications.warn(game.i18n.localize("SW25.NotResource") + ":" + game.i18n.localize("SW25.Item.Phasearea." + lifeline));
      return postPhaseareaEffect(this.actor, currentTokens[0].actor.name, effects[0].name, lifeline);
    };
    if (item.system.maxcost && item.system.mincost != item.system.maxcost) {
      return showPhaseareaCostDialog({ name: item.name, minimum: item.system.mincost, maximum: item.system.maxcost }, apply);
    }
    return apply(item.system.mincost || 0);
  }

  static async _onResetResources(event, button) {
    if (!this.actor.isOwner) return;
    const type = button.dataset.resourceType;
    if (!["note", "lifeline", "tacspower"].includes(type)) return;
    const updated = await updateAllResourceQuantities(this.actor, { type }, null);
    if (!updated) ui.notifications.warn(game.i18n.localize("SW25.NotResource"));
  }

  static async _onUpdateTacspower(event, button) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(button.closest("[data-item-id]").dataset.itemId);
    const operation = { get: gainTacspower, cost: spendTacspower }[button.dataset.tacspower];
    if (item?.type !== "tactics" || !operation) return;
    const tokens = await Util.getControlledActor(this.actor);
    if (tokens.length !== 1) {
      return ui.notifications.warn(game.i18n.localize(tokens.length ? "SW25.Multiselectwarn" : "SW25.Noselectwarn"));
    }
    const missing = await operation(this.actor, item);
    for (const resource of missing) ui.notifications.warn(game.i18n.localize("SW25.NotResource"));
  }

  static async _onUpdateNotes(event, button) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(button.closest("[data-item-id]").dataset.itemId);
    const operation = { get: gainNotes, add: gainAdditionalNotes, cost: spendNotes }[button.dataset.notes];
    if (item?.type !== "magicalsong" || !operation) return;
    const tokens = await Util.getControlledActor(this.actor);
    if (tokens.length !== 1) {
      return ui.notifications.warn(game.i18n.localize(tokens.length ? "SW25.Multiselectwarn" : "SW25.Noselectwarn"));
    }
    const missing = await operation(this.actor, item);
    for (const resource of missing) ui.notifications.warn(game.i18n.localize("SW25.NotResource"));
  }

  static async _onUseAlchemy(event, button) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(button.closest("[data-item-id]").dataset.itemId);
    const rank = button.dataset.rank;
    if (item?.type !== "alchemytech" || !["b", "a", "s", "ss"].includes(rank)) return;
    const tokens = await Util.getControlledActor(this.actor);
    if (tokens.length !== 1) {
      return ui.notifications.warn(game.i18n.localize(tokens.length ? "SW25.Multiselectwarn" : "SW25.Noselectwarn"));
    }
    const results = await useAlchemy(this.actor, item, rank);
    return postAlchemyCost(this.actor, item.name, rank.toUpperCase(), results);
  }

  static async _onApplyItemEffects(event, button) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(button.closest("[data-item-id]").dataset.itemId);
    if (!item?.effects.size) return;
    let targets = game.user.targets;
    if (!item.system.selfbuff && !targets.size) {
      const selected = await targetSelectDialog(item.name + " (" + game.i18n.localize("SW25.Effectslong") + ")");
      if (!selected?.length) return;
      targets = new Set(selected);
    }
    const result = applyItemEffects(this.actor, item, targets);
    for (const target of Array.from(game.user.targets)) target.setTarget(false);
    return postAppliedEffects(this.actor, result.targetNames, result.effectNames);
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
