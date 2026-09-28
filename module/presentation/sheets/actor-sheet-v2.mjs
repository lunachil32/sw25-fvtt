import { prepareActorSheetContext } from "../sheet-context/actor-context.mjs";

/** Optional, minimal PC sheet for exercising the shared presentation and use-cases. */
export class SW25ActorSheetV2 extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["sw25-actor-v2"],
    position: { width: 560, height: 540 },
    window: { resizable: true },
    viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
  };

  static PARTS = {
    overview: { template: "systems/sw25-lunachil-maintained/templates/actor/v2/overview.hbs" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const data = this.actor.toObject(false);
    return prepareActorSheetContext(this.actor, {
      ...context, actor: this.actor, data, items: data.items,
    });
  }
}
