import { prepareItemFieldAdjustment, saveItemFieldAdjustment } from "../../use-cases/edit-item-field.mjs";

/** Connect buttons to the same Item persistence used by direct input fields. */
export function bindItemFieldButtons(html, actor, submit) {
  for (const { selector, inputSelector, limitQuantity, followupProperty } of buttons) {
    html.find(selector).click(async (event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const input = element.closest("li").querySelector(inputSelector);
      const property = element.dataset.property;
      const item = actor.items.get($(element).parents(".item")[0].dataset.itemId);
      const result = prepareItemFieldAdjustment(item, input.value, element.dataset.action, { limitQuantity });

      for (const limit of result.limits) {
        const key = limit === "max" ? "SW25.isAlreadyMax" : "SW25.isAlreadyMin";
        ui.notifications.warn('"' + item.name + '"' + game.i18n.localize(key));
      }
      input.value = result.value;

      if (item) {
        await saveItemFieldAdjustment(item, property, result.value, followupProperty);
      }
      submit();
    });
  }
}

// The first write uses data-property verbatim, including its existing "item." prefix.
// A second, unawaited write uses the following field; these legacy writes are intentional here.
const buttons = [
  { selector: ".quantity-button", inputSelector: "input.qt-change", limitQuantity: true, followupProperty: "system.quantity" },
  { selector: ".changesl-button", inputSelector: "input.sl-change", followupProperty: "system.skilllevel" },
  // Keep the effective legacy checkmod3 destination; correcting it is a separate bug fix.
  { selector: ".checkmod-button", inputSelector: "input.cm-change", followupProperty: "system.checkmod3" },
];
