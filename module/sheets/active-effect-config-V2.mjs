import { prepareEffectContextV2 } from "../presentation/sheet-context/effect-context.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActiveEffectConfig}
 */
export class SW25ActiveEffectConfigV2 extends ActiveEffectConfig {
  static PARTS = {
    header: { template: "templates/sheets/active-effect/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    details: {
      template: "templates/sheets/active-effect/details.hbs",
      scrollable: [""],
    },
    duration: { template: "templates/sheets/active-effect/duration.hbs" },
    changes: {
      template: "systems/sw25-lunachil-maintained/templates/effect/changes.hbs",
      scrollable: ["ol[data-changes]"],
    },
    footer: { template: "templates/generic/form-footer.hbs" },
  };

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext() {
    return prepareEffectContextV2(await super._prepareContext());
  }

  /** override render */
  render(force = false, options = {}) {
    const promise = super.render(force, options);

    this._setupSelectObserver();

    return promise;
  }

  /** Add MutationObserver */
  _setupSelectObserver() {
    const observer = new MutationObserver(() => {
      const selects = document.querySelectorAll(
        ".select-keyname:not([data-listener])"
      );

      selects.forEach((select) => {
        select.dataset.listener = "true";

        select.addEventListener("change", (event) => {
          const value = event.target.value;
          const container = select.closest(".key");

          if (!container) return;

          container
            .querySelectorAll("input.dynamic-input")
            .forEach((el) => el.remove());

          if (value === "checkinput" || value === "input") {
            const input = document.createElement("input");
            input.type = "text";
            input.classList.add("dynamic-input");
            input.style.maxWidth = "calc(60% - 7px)";
            input.name = select.name.replace(".key", ".key");

            container.appendChild(input);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}
