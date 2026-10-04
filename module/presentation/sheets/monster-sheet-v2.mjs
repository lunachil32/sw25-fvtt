import { SW25NpcSheetV2 } from "./npc-sheet-v2.mjs";
import { createActorCheckRequest, prepareMonsterCheckRequest, revealMonsterData } from "../../use-cases/actor-check-requests.mjs";
import { postActorCheckRequest, postMonsterCheckRequest, postMonsterReveal } from "../chat/check-requests.mjs";
import { lootRoll } from "../../helpers/lootroll.mjs";
import { mpCost } from "../../helpers/mpcost.mjs";
import { isMpCostTarget } from "../../services/resource-consumption.mjs";
import { Util } from "../../helpers/utils.mjs";

/** Monster presentation and its requests share the existing use-cases. */
export class SW25MonsterSheetV2 extends SW25NpcSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: ["sw25-monster-v2"],
    actions: {
      requestCheck: SW25MonsterSheetV2._onRequestCheck,
      requestKnowledge: SW25MonsterSheetV2._onRequestKnowledge,
      requestInitiative: SW25MonsterSheetV2._onRequestInitiative,
      revealMonster: SW25MonsterSheetV2._onRevealMonster,
      rollLoot: SW25MonsterSheetV2._onRollLoot,
      paySummonCost: SW25MonsterSheetV2._onPaySummonCost,
    },
  };

  static PARTS = {
    sheet: {
      template: "systems/sw25-lunachil-maintained/templates/actor/v2/monster.hbs",
      scrollable: [".sheet-body"],
      templates: [
        "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-monsterabilities.hbs",
        "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-monsterspells.hbs",
        "systems/sw25-lunachil-maintained/templates/actor/v2/parts/actor-monsterskills.hbs",
      ],
    },
  };

  static TABS = {
    primary: {
      initial: "ability",
      tabs: [
        { id: "ability", label: "SW25.Monster.Ability" },
        { id: "effects", label: "SW25.Effects" },
        { id: "description", label: "SW25.Description" },
        { id: "details", label: "SW25.Details" },
        { id: "fellowAction", label: "SW25.ActionTable" },
        { id: "fellowSetting", label: "SW25.Setting" },
      ],
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.lootHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.actor.system.loot ?? "", {
      secrets: this.actor.isOwner, relativeTo: this.actor, rollData: this.actor.getRollData(),
    });
    return context;
  }

  async _requestMonsterCheck(kind) {
    if (!this.isEditable) return;
    const { request, isView } = await prepareMonsterCheckRequest(this.actor, kind);
    return postMonsterCheckRequest(this.actor, kind, request, isView);
  }

  static _onRequestCheck(event, button) {
    if (!this.isEditable) return;
    return postActorCheckRequest(this.actor, createActorCheckRequest(button.dataset.label, button.dataset.value));
  }

  static _onRequestKnowledge() {
    return this._requestMonsterCheck("knowledge");
  }

  static _onRequestInitiative() {
    return this._requestMonsterCheck("initiative");
  }

  static async _onRevealMonster() {
    if (!this.isEditable || !game.user.isGM) return;
    await revealMonsterData(this.actor);
    return postMonsterReveal(this.actor);
  }

  static _onRollLoot() {
    if (!this.isEditable) return;
    return lootRoll(this.actor);
  }

  static async _onPaySummonCost(event, button) {
    if (!this.isEditable) return;
    const tokens = await Util.getControlledActor(this.actor);
    if (tokens.length !== 1) {
      return ui.notifications.warn(game.i18n.localize(tokens.length ? "SW25.Multiselectwarn" : "SW25.Noselectwarn"));
    }
    const { cost, label, type, id } = button.dataset;
    if (!isMpCostTarget(tokens[0].actor, { sourceActorId: id, type })) {
      return ui.notifications.warn(game.i18n.localize("SW25.SummonMpwarn"));
    }
    return mpCost(tokens[0], cost, label, type, 1);
  }
}
