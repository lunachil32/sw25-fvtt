import { SW25ActorSheetV2 } from "./actor-sheet-v2.mjs";

/** NPC layout with the shared native V2 document and item operations. */
export class SW25NpcSheetV2 extends SW25ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["sw25-npc-v2"],
    viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
  };

  static PARTS = {
    sheet: { template: "systems/sw25-lunachil-maintained/templates/actor/v2/npc.hbs", scrollable: [".sheet-body"] },
  };

  static TABS = {
    primary: {
      initial: "description",
      tabs: [
        { id: "description", label: "SW25.Description" },
        { id: "details", label: "SW25.Details" },
        { id: "effects", label: "SW25.Effects" },
        { id: "fellowAction", label: "SW25.ActionTable" },
        { id: "fellowSetting", label: "SW25.Setting" },
      ],
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system.limited = this.actor.limited;
    context.system.isgm = game.user.isGM;
    context.overviewHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.actor.system.overview ?? "", {
      secrets: this.actor.isOwner, relativeTo: this.actor, rollData: this.actor.getRollData(),
    });
    context.gminfoHTML = game.user.isGM
      ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.actor.system.gminfo ?? "", {
        secrets: true, relativeTo: this.actor, rollData: this.actor.getRollData(),
      }) : "";
    return context;
  }
}
