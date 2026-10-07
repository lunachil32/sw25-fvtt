import { getWeaponTypeElements } from "../../rules/elements.mjs";
import { addCustomField, removeCustomField, moveCustomFieldUp, moveCustomFieldDown } from "../../use-cases/item-custom-fields.mjs";
import { resolveSessionResult } from "../../use-cases/session-results.mjs";
import { postSessionResult } from "../chat/session-messages.mjs";
import { manageEffectV2 } from "./effect-controls-v2.mjs";
import { prepareItemSheetContext } from "../sheet-context/item-context.mjs";
import { prepareItemV2FieldGroups } from "../sheet-context/item-v2-fields.mjs";

// V12 has no document sheet V2; use its ApplicationV2 only to load this unregistered class.
export class SW25ItemSheetV2 extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets?.ItemSheetV2 ?? foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    actions: { customField: SW25ItemSheetV2._onCustomField, sessionResult: SW25ItemSheetV2._onSessionResult, create: manageEffectV2, edit: manageEffectV2, toggle: manageEffectV2, delete: manageEffectV2 },
    classes: ["sw25-item-v2"],
    position: { width: 580, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
  };

  static PARTS = {
    weapon: {
      template: "systems/sw25-lunachil-maintained/templates/item/v2/weapon.hbs",
      scrollable: [".sheet-body"],
      templates: ["elements", "usedice", "usepower", "effects"].map(name =>
        `systems/sw25-lunachil-maintained/templates/item/parts/item-${name}.hbs`),
    },
    effects: { template: "systems/sw25-lunachil-maintained/templates/shared/v2/effects.hbs" },
    details: { template: "systems/sw25-lunachil-maintained/templates/item/v2/details.hbs" },
  };

  constructor(options = {}) {
    if (options.document?.type === "weapon") {
      options = foundry.utils.mergeObject({
        classes: ["sw25", "sheet", "item", "sw25-weapon-v2"],
        position: { width: 620, height: 480 },
      }, options, { inplace: false });
    }
    super(options);
  }

  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    if (this.item.type === "weapon") return { weapon: parts.weapon };
    delete parts.weapon;
    return parts;
  }

  _getTabsConfig(group) {
    if (this.item.type !== "weapon" || group !== "primary") return super._getTabsConfig(group);
    return {
      initial: "description",
      tabs: [
        { id: "description", label: "SW25.Description" },
        { id: "details", label: "SW25.Details" },
        { id: "effects", label: "SW25.Effects" },
      ],
    };
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const prepared = prepareItemSheetContext(this.item, {
      ...context, item: this.item, data: this.item.toObject(false),
    });
    prepared.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.item.system.description ?? "", {
      secrets: this.item.isOwner, rollData: prepared.rollData, relativeTo: this.item,
    });
    prepared.isSession = this.item.type === "session";
    if (this.item.type === "weapon") prepared.tabs = this._prepareTabs("primary");
    else prepared.itemFieldGroups = prepareItemV2FieldGroups(this.item, prepared);
    return prepared;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    if (this.item.type !== "weapon") return;
    for (const action of this.element.querySelectorAll(".sw25item [data-action]:not([data-action='tab'])")) {
      action.setAttribute("aria-disabled", String(!this.isEditable));
    }
  }

  static async _onCustomField(event, button) {
    if (!this.item.isOwner) return;
    const operation = button.dataset.operation;
    if (operation === "add") return addCustomField(this.item);
    const index = Number(button.dataset.index);
    const count = Object.values(this.item.system.customFields ?? {}).length;
    if (!Number.isInteger(index) || index < 0 || index >= count) return;
    const action = { remove: removeCustomField, up: moveCustomFieldUp, down: moveCustomFieldDown }[operation];
    if (action) return action(this.item, index);
  }

  static async _onSessionResult() {
    if (!this.item.isOwner || this.item.type !== "session") return;
    const result = await resolveSessionResult(this.item);
    await postSessionResult(result, game.i18n.localize("SW25.Item.Session.Result.Label"));
  }

  _processFormData(event, form, formData) {
    const name = event?.type === "change" ? event.target.name : null;
    const customField = name?.match(/^system\.customFields\.([^.]*)\.(label|value)$/);
    if (customField) {
      const fields = foundry.utils.duplicate(this.item.system.customFields ?? []);
      const [, index, property] = customField;
      if (!fields[index]) return {};
      fields[index][property] = formData.object[name];
      return { system: { customFields: fields } };
    }
    if (name) {
      const updates = { [name]: formData.object[name] };
      if (this.item.type === "weapon" && name === "system.type") {
        for (const [key, value] of Object.entries(getWeaponTypeElements(updates[name]) ?? {})) {
          updates[`system.elements.${key}`] = value;
        }
      }
      return foundry.utils.expandObject(updates);
    }
    return super._processFormData(event, form, formData);
  }
}

/** Open an embedded item without falling back to its V1 default sheet. */
export function openItemSheetV2(item) {
  const sheet = Object.values(item.apps).find(app => app instanceof SW25ItemSheetV2)
    ?? new SW25ItemSheetV2({ document: item });
  return sheet.render(true);
}
