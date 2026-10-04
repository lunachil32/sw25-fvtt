import { rollActorFormula } from "../rolls/actor-formula.mjs";
import { consumeActorResource } from "../../use-cases/consume-actor-resource.mjs";
import { assignActionTableEntry } from "../../use-cases/action-table.mjs";
import { presentPhaseareaUse } from "../use-phasearea.mjs";
import { bookmarkItem, toggleItemBookmark } from "../../use-cases/item-bookmarks.mjs";
import { actionRoll } from "../../helpers/actionroll.mjs";
import { growthCheck } from "../../helpers/growthcheck.mjs";
import { updateAllResourceQuantities } from "../../services/resource-quantity.mjs";
import { gainTacspower, spendTacspower } from "../../use-cases/tacspower.mjs";
import { gainNotes, gainAdditionalNotes, spendNotes } from "../../use-cases/notes.mjs";
import { useAlchemy } from "../../use-cases/use-alchemy.mjs";
import { postAlchemyCost, postResourceCost } from "../chat/resource-messages.mjs";
import { applyItemEffects } from "../../use-cases/apply-item-effects.mjs";
import { targetSelectDialog } from "../../helpers/dialogs.mjs";
import { postAppliedEffects } from "../chat/effect-messages.mjs";
import { manageEffectV2 } from "./effect-controls-v2.mjs";
import { payItemVitalCost } from "../../use-cases/item-vital-cost.mjs";
import { Util } from "../../helpers/utils.mjs";
import { createActorItem, deleteActorItem } from "../../use-cases/actor-items.mjs";
import { openItemSheetV2 } from "./item-sheet-v2.mjs";
import { supportedItemTypesV2 } from "../sheet-context/item-v2-fields.mjs";
import { editItemField, prepareItemFieldAdjustment, saveItemFieldAdjustment } from "../../use-cases/edit-item-field.mjs";
import { prepareActorSheetContext } from "../sheet-context/actor-context.mjs";

/** PC sheet using the shared presentation and use-cases with native V2 events. */
export class SW25ActorSheetV2 extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["sw25", "sheet", "actor", "sw25-actor-v2"],
    tag: "form",
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      toggleSidebar: SW25ActorSheetV2._onToggleSidebar,
      adjustItemField: SW25ActorSheetV2._onAdjustItemField,
      adjustActorField: SW25ActorSheetV2._onAdjustActorField,
      toggleContract: SW25ActorSheetV2._onToggleContract,
      scrollBookmarks: SW25ActorSheetV2._onScrollBookmarks,
      toggleDetails: SW25ActorSheetV2._onToggleDetails,
      executeMacro: SW25ActorSheetV2._onExecuteMacro,
      payResource: SW25ActorSheetV2._onPayResource,
      rollFormula: SW25ActorSheetV2._onRollFormula,
      create: manageEffectV2, edit: manageEffectV2, toggle: manageEffectV2, delete: manageEffectV2,
      rollActionTable: SW25ActorSheetV2._onRollActionTable,
      growthCheck: SW25ActorSheetV2._onGrowthCheck,
      gainLifeline: SW25ActorSheetV2._onGainLifeline,
      resetResources: SW25ActorSheetV2._onResetResources,
      toggleBookmark: SW25ActorSheetV2._onToggleBookmark,
      createItem: SW25ActorSheetV2._onCreateItem,
      useAlchemy: SW25ActorSheetV2._onUseAlchemy,
      updateNotes: SW25ActorSheetV2._onUpdateNotes,
      updateTacspower: SW25ActorSheetV2._onUpdateTacspower,
      usePhasearea: SW25ActorSheetV2._onUsePhasearea,
      applyItemEffects: SW25ActorSheetV2._onApplyItemEffects,
      payItemCost: SW25ActorSheetV2._onPayItemCost,
      editItem: SW25ActorSheetV2._onEditItem,
      deleteItem: SW25ActorSheetV2._onDeleteItem,
    },
    position: { width: 800, height: 700 },
    window: { resizable: true },
    viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
  };

  static TABS = {
    sidebar: {
      initial: "status",
      tabs: [
        { id: "status", label: "SW25.Status", icon: "fa-solid fa-square-poll-vertical" },
        { id: "battle", label: "SW25.Battle", icon: "fa-solid fa-hand-back-fist" },
        { id: "adventure", label: "SW25.Adventure", icon: "fa-solid fa-binoculars" },
      ],
    },
    primary: {
      initial: "check",
      tabs: [
        { id: "fellowAction", label: "SW25.ActionTable", icon: "fa-solid fa-dice-d6" },
        { id: "fellowSetting", label: "SW25.Setting", icon: "fa-solid fa-gear" },
        { id: "check", label: "SW25.Check", icon: "fa-solid fa-cube" },
        { id: "battle", label: "SW25.Equip", icon: "fa-solid fa-shield" },
        { id: "features", label: "SW25.Features", icon: "fa-solid fa-hands-holding-circle" },
        { id: "spells", label: "SW25.Spells", icon: "fa-solid fa-book-tanakh" },
        { id: "effects", label: "SW25.Effects", icon: "fa-solid fa-hand-sparkles" },
        { id: "items", label: "SW25.Items", icon: "fa-solid fa-suitcase" },
        { id: "description", label: "SW25.Description", icon: "fa-solid fa-id-card" },
      ],
    },
  };

  static PARTS = {
    sheet: { template: "systems/sw25-lunachil-maintained/templates/actor/v2/character.hbs", scrollable: [".sheet-body", ".sidebar-body .tab"] },
  };

  async _prepareContext(options) {
    await foundry.applications.handlebars.loadTemplates(actorPartials);
    const context = await super._prepareContext(options);
    context.token = this.token;
    const data = this.actor.toObject(false);
    context.sidebarCollapsed = this._sidebarCollapsed ?? Boolean(data.system.isSidebar);
    context.sessions = data.items.filter(item => item.type === "session");
    const isFellowTab = id => ["fellowAction", "fellowSetting"].includes(id);
    const primaryIds = this.constructor.TABS.primary.tabs.map(tab => tab.id).filter(id => isFellowTab(id) === Boolean(data.system.toFellow));
    if (!primaryIds.includes(this.tabGroups.primary)) this.tabGroups.primary = primaryIds[0];
    context.tabs = this._prepareTabs("primary");
    context.sidebarTabs = this._prepareTabs("sidebar");
    context.biographyHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.actor.system.biography ?? "", {
      secrets: this.actor.isOwner, rollData: this.actor.getRollData(), relativeTo: this.actor,
    });
    await Promise.all(data.items.map(async item => {
      if (!item.system.description) return;
      item.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(item.system.description, {
        secrets: this.actor.isOwner, rollData: this.actor.getRollData(), relativeTo: this.actor.items.get(item._id),
      });
    }));
    return prepareActorSheetContext(this.actor, {
      ...context, actor: this.actor, data, items: data.items,
    });
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const element of this.element.querySelectorAll(".character [data-action]")) {
      if (["tab", "toggleSidebar", "toggleDetails", "scrollBookmarks", "editItem"].includes(element.dataset.action)) {
        if (element instanceof HTMLButtonElement) element.disabled = false;
        continue;
      }
      if (!this.isEditable) element.setAttribute("aria-disabled", "true");
    }
  }

  async _onDropItem(event, item) {
    if (!this.isEditable) return;
    const slot = event.target.closest("[data-area]");
    if (slot && item.type === "action") return assignActionTableEntry(this.actor, item, slot.dataset.area);
    if (event.target.closest(".bookmark-drop-area")) return bookmarkItem(this.actor, item);
    return super._onDropItem(event, item);
  }

  _onChangeForm(formConfig, event) {
    if (event.target.matches("[data-item-field]")) return this._onItemFieldChange(event);
    if (!event.target.name) return;
    return super._onChangeForm(formConfig, event);
  }

  _processFormData(event, form, formData) {
    // A single field change must not overwrite other prepared or concurrently updated values.
    const name = event?.type === "change" ? event.target.name : null;
    if (name) return foundry.utils.expandObject({ [name]: formData.object[name] });
    return super._processFormData(event, form, formData);
  }

  async _onItemFieldChange(event) {
    if (!this.isEditable) return;
    const input = event.target;
    const item = this.actor.items.get(input.closest("[data-item-id]")?.dataset.itemId);
    const field = inlineItemFields[input.dataset.itemField];
    if (!item || !field || (field.types && !field.types.includes(item.type))) return;
    if (field.editMode && !this.actor.system.isEdit) return;
    return editItemField(item, field.property, field.numeric ? input.value : input.checked, field);
  }

  static async _onCreateItem(event, button) {
    if (!this.isEditable) return;
    const type = button.dataset.itemType;
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
    return presentPhaseareaUse(this.actor, item);
  }

  static async _onRollActionTable(event, button) {
    if (!this.actor.isOwner) return;
    return actionRoll(button, this.actor);
  }

  static async _onGrowthCheck() {
    if (!this.actor.isOwner) return;
    return growthCheck(this.actor);
  }

  static async _onGainLifeline() {
    if (!this.actor.isOwner) return;
    const updated = await updateAllResourceQuantities(this.actor, { type: "lifeline" }, 1);
    if (!updated) ui.notifications.warn(game.i18n.localize("SW25.NotResource"));
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
    const rank = button.dataset.rank ?? button.textContent.trim().toLowerCase();
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

  static async _onToggleBookmark(event, button) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(button.closest("[data-item-id]").dataset.itemId);
    if (item) return toggleItemBookmark(item);
  }

  static async _onEditItem(event, button) {
    const item = this.actor.items.get(button.closest("[data-item-id]").dataset.itemId);
    if (item) await openItemSheetV2(item);
  }

  static async _onRollFormula(event, button) {
    if (!this.isEditable) return;
    const item = this.actor.items.get(button.dataset.itemid ?? button.closest("[data-item-id]")?.dataset.itemId);
    if (button.dataset.rollType === "item") return item?.roll();
    return rollActorFormula(this.actor, button.dataset, item?.id, game.user.targets);
  }

  static async _onPayResource(event, button) {
    if (!this.isEditable || !button.dataset.resuse) return;
    const result = await consumeActorResource(this.actor, button.dataset.resuse, button.dataset.resusequantity);
    if (!result.consumed) return ui.notifications.warn(game.i18n.localize("SW25.Item.Noresquantitiywarn") + result.name);
    return postResourceCost(ChatMessage.getSpeaker({ actor: this.actor }), result.name, result);
  }

  static _onExecuteMacro(event, button) {
    if (!this.isEditable) return;
    return this.actor.items.get(button.closest("[data-item-id]")?.dataset.itemId)?.executeMacro(event);
  }

  static _onToggleDetails(event, button) {
    const kind = button.dataset.detail;
    const row = button.closest(kind === "spell" ? ".spell" : kind === "action" ? ".action" : ".item");
    for (const detail of row?.querySelectorAll(`.${kind}-description`) ?? []) {
      detail.style.display = getComputedStyle(detail).display === "none" ? "block" : "none";
    }
  }

  static _onToggleSidebar() {
    const input = this.element.querySelector("[data-sidebar-toggle]");
    this._sidebarCollapsed = input.checked = !input.checked;
  }

  static _onScrollBookmarks(event, button) {
    const container = this.element.querySelector(".bookmark-container");
    container.scrollBy({ left: button.classList.contains("left") ? -116 : 116, behavior: "smooth" });
  }

  static async _onToggleContract(event, button) {
    if (!this.isEditable) return;
    const path = button.dataset.path;
    if (!/^system\.attributes\.fairy\.(earth|water|fire|wind|light|dark)$/.test(path)) return;
    return this.actor.update({ [path]: !foundry.utils.getProperty(this.actor, path) });
  }

  static async _onAdjustActorField(event, button) {
    if (!this.isEditable) return;
    const path = button.dataset.property;
    if (!["system.attributes.fumble", "system.attributes.impurity"].includes(path)) return;
    const input = this.element.querySelector(`[name="${path}"]`);
    const value = Number(input.value) || 0;
    return this.actor.update({ [path]: value + (button.dataset.adjustment === "decrease" ? -1 : 1) });
  }

  static async _onAdjustItemField(event, button) {
    if (!this.isEditable) return;
    const row = button.closest("[data-item-id]");
    const item = this.actor.items.get(row?.dataset.itemId);
    const field = button.dataset.field;
    const input = row?.querySelector(`[data-item-field="${field}"]`);
    if (!item || !input) return;
    const result = prepareItemFieldAdjustment(item, input.value, button.dataset.adjustment, { limitQuantity: field === "quantity" });
    for (const limit of result.limits) ui.notifications.warn('"' + item.name + '"' + game.i18n.localize(limit === "max" ? "SW25.isAlreadyMax" : "SW25.isAlreadyMin"));
    const followup = field === "checkmod" ? "system.checkmod3" : `system.${field}`;
    return saveItemFieldAdjustment(item, button.dataset.property, result.value, followup);
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

const featureItemTypes = ["combatability", "raceability", "enhancearts", "ridingtrick", "alchemytech", "magicalsong", "phasearea", "tactics", "infusion", "barbarousskill", "essenceweave", "otherfeature"];

const inlineItemFields = {
  quantity: { property: "system.quantity", numeric: true },
  checkmod1: { property: "system.checkmod1", numeric: true, zeroAsNull: true },
  checkmod2: { property: "system.checkmod2", numeric: true, zeroAsNull: true },
  checkmod3: { property: "system.checkmod3", numeric: true, zeroAsNull: true },
  powermod: { property: "system.powermod", numeric: true, zeroAsNull: true },

  skilllevel: { property: "system.skilllevel", numeric: true, editMode: true, types: ["skill"] },
  skillmod: { property: "system.skillmod", numeric: true, zeroAsNull: true, types: ["skill"] },
  checkmod: { property: "system.checkmod", numeric: true, zeroAsNull: true, types: ["check"] },
  conversation: { property: "system.conversation", editMode: true, types: ["language"] },
  reading: { property: "system.reading", editMode: true, types: ["language"] },
  equip: { property: "system.equip", types: ["weapon", "armor", "accessory", "spell", ...featureItemTypes] },
};

const actorPartials = [
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-skills.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-resources.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-battlechecks.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-checks.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-checkskills.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-battleweapons.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-battlearmors.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-battleaccessories.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-raceabilities.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-sessions.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-useitems.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-combatabilities.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-enhancearts.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-magicalsongs.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-ridingtricks.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-alchemytechs.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-phaseareas.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-tactics.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-infusion.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-barbarousskill.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-essenceweave.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-otherfeature.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells-sorcerer.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spell-item.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells-conjurer.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells-wizard.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells-priest.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells-magitech.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells-fairy.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells-druid.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells-daemon.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells-abyssal.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells-bibliomancer.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-spells.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-effects.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-items.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-weapons.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-armors.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-accessories.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-languages.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-actions-fellow.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-actions-daemon.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-actions.hbs",
  "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-bookmark-item.hbs",
];
