import { resolveSessionResult } from "../../use-cases/session-results.mjs";
import { postSessionResult } from "../chat/session-messages.mjs";
import { manageEffectV2 } from "./effect-controls-v2.mjs";
import { prepareItemSheetContext } from "../sheet-context/item-context.mjs";
import { prepareItemV2FieldGroups } from "../sheet-context/item-v2-fields.mjs";

export class SW25ItemSheetV2 extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    actions: { sessionResult: SW25ItemSheetV2._onSessionResult, create: manageEffectV2, edit: manageEffectV2, toggle: manageEffectV2, delete: manageEffectV2 },
    classes: ["sw25-item-v2"],
    position: { width: 580, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
  };

  static PARTS = {
    effects: { template: "systems/sw25-lunachil-maintained/templates/shared/v2/effects.hbs" },
    details: { template: "systems/sw25-lunachil-maintained/templates/item/v2/details.hbs" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const prepared = prepareItemSheetContext(this.item, {
      ...context, item: this.item, data: this.item.toObject(false),
    });
    prepared.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.item.system.description ?? "", {
      secrets: this.item.isOwner, rollData: prepared.rollData, relativeTo: this.item,
    });
    prepared.isSession = this.item.type === "session";
    prepared.itemFieldGroups = prepareItemV2FieldGroups(this.item, prepared);
    return prepared;
  }

  static async _onSessionResult() {
    if (!this.item.isOwner || this.item.type !== "session") return;
    const result = await resolveSessionResult(this.item);
    await postSessionResult(result, game.i18n.localize("SW25.Item.Session.Result.Label"));
  }

  _processFormData(event, form, formData) {
    const name = event?.type === "change" ? event.target.name : null;
    if (name) return foundry.utils.expandObject({ [name]: formData.object[name] });
    return super._processFormData(event, form, formData);
  }
}

/** Open an embedded item without falling back to its V1 default sheet. */
export function openItemSheetV2(item) {
  const sheet = Object.values(item.apps).find(app => app instanceof SW25ItemSheetV2)
    ?? new SW25ItemSheetV2({ document: item });
  return sheet.render(true);
}
