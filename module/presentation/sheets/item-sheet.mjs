import { postSessionResult } from "../chat/session-messages.mjs";
import { prepareItemSheetContext } from "../sheet-context/item-context.mjs";
import {
  onManageActiveEffect,
} from "../../helpers/effects.mjs";
import { SW25 } from "../../helpers/config.mjs";
import { resolveSessionResult } from "../../use-cases/session-results.mjs";
import {
  applyPropertyElements,
  applyWeaponTypeElements,
} from "../../services/item-elements.mjs";
import {
  addCustomField,
  removeCustomField,
  moveCustomFieldUp,
  moveCustomFieldDown,
} from "../../services/item-custom-fields.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class SW25ItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw25", "sheet", "item"],
      width: 620,
      height: 480,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = "systems/sw25-lunachil-maintained/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.hbs`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.hbs`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    return prepareItemSheetContext(this.item, super.getData());
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    // Active Effect management
    html.on("click", ".effect-control", (ev) =>
      onManageActiveEffect(ev, this.item)
    );

    // Session Result.
    html.on("click", ".session-result", this._onSessionResult.bind(this));

    // Add Field.
    html.find(".add-field").click((ev) => {
      ev.preventDefault();
      addCustomField(this.item);
    });

    // Delete Field.
    html.find(".remove-field").click((ev) => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.idx);
      removeCustomField(this.item, idx);
    });

    // Move up.
    html.find(".move-up").click((ev) => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.idx);
      moveCustomFieldUp(this.item, idx);
    });

    // Move down.
    html.find(".move-down").click((ev) => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.idx);
      moveCustomFieldDown(this.item, idx);
    });

    html.find('[name="system.prop"]').on("change", async (event) => {
      if (await applyPropertyElements(this.item, event.target.value)) this.render();
    });

    html.find('[name="system.type"]').on("change", async (event) => {
      if (await applyWeaponTypeElements(this.item, event.target.value)) this.render();
    });
  }

  async _onSessionResult(event) {
    event.preventDefault();
    const label = game.i18n.localize("SW25.Item.Session.Result.Label");
    const result = await resolveSessionResult(this.item);
    await postSessionResult(result, label);
  }
}
