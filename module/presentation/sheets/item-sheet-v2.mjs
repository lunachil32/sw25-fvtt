import { prepareItemSheetContext } from "../sheet-context/item-context.mjs";
import { prepareItemV2Fields } from "../sheet-context/item-v2-fields.mjs";

export class SW25ItemSheetV2 extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["sw25-item-v2"],
    position: { width: 580, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
  };

  static PARTS = {
    details: { template: "systems/sw25-lunachil-maintained/templates/item/v2/details.hbs" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return prepareItemSheetContext(this.item, {
      ...context, item: this.item, data: this.item.toObject(false),
      itemFields: prepareItemV2Fields(this.item),
    });
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
