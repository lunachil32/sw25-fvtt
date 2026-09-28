import { editItemField } from "../../use-cases/edit-item-field.mjs";

/** Bind native field changes; only values and Documents cross the use-case boundary. */
export function bindItemFieldChanges(html, actor) {
  for (const { selector, property, numeric, zeroAsNull, waitForUpdate } of fields) {
    html.on("change", selector, async (event) => {
      event.preventDefault();
      const element = event.currentTarget;
      const item = actor.items.get($(element).parents(".item")[0].dataset.itemId);
      const value = numeric ? element.value : element.checked;
      // Only quantity changes awaited persistence in the existing sheet.
      if (waitForUpdate) {
        await editItemField(item, property, value, { numeric, zeroAsNull });
      } else {
        editItemField(item, property, value, { numeric, zeroAsNull });
      }
    });
  }
}

const fields = [
  { selector: ".qt-change", property: "system.quantity", numeric: true, waitForUpdate: true },
  { selector: ".sl-change", property: "system.skilllevel", numeric: true },
  { selector: ".sc-change", property: "system.skillmod", numeric: true, zeroAsNull: true },
  { selector: ".cm-change", property: "system.checkmod", numeric: true, zeroAsNull: true },
  { selector: ".cm1-change", property: "system.checkmod1", numeric: true, zeroAsNull: true },
  { selector: ".cm2-change", property: "system.checkmod2", numeric: true, zeroAsNull: true },
  { selector: ".cm3-change", property: "system.checkmod3", numeric: true, zeroAsNull: true },
  { selector: ".pm-change", property: "system.powermod", numeric: true, zeroAsNull: true },
  { selector: ".eq-change", property: "system.equip" },
  { selector: ".rd-change", property: "system.reading" },
  { selector: ".cv-change", property: "system.conversation" },
];
