import { showEffectTargetDialog } from "../dialogs/effect-target.mjs";
import { showPhaseareaCostDialog } from "../dialogs/phasearea-cost.mjs";
import { postActorCheck } from "../chat/check-roll.mjs";
import { postActorPower } from "../chat/power-roll.mjs";
import { postApplyAll } from "../chat/apply-all.mjs";
import { postAppliedEffects, postPhaseareaEffect } from "../chat/effect-messages.mjs";
import { postAlchemyCost, postResourceCost } from "../chat/resource-messages.mjs";
import { postActorCheckRequest, postMonsterCheckRequest, postMonsterReveal } from "../chat/check-requests.mjs";
import { prepareActorSheetContext } from "../sheet-context/actor-context.mjs";
import {
  onManageActiveEffect,
} from "../../helpers/effects.mjs";
import { mpCost, hpCost } from "../../helpers/mpcost.mjs";
import { lootRoll } from "../../helpers/lootroll.mjs";
import { growthCheck } from "../../helpers/growthcheck.mjs";
import { actionRoll } from "../../helpers/actionroll.mjs";
import { targetRollDialog, targetSelectDialog } from "../../helpers/dialogs.mjs";
import { SW25 } from "../../helpers/config.mjs";
import { Util } from "../../helpers/utils.mjs";
import { updateAllResourceQuantities, limitResourceQuantity } from "../../services/resource-quantity.mjs";
import { gainNotes, gainAdditionalNotes, spendNotes } from "../../services/notes.mjs";
import { gainTacspower, spendTacspower } from "../../services/tacspower.mjs";
import { consumeResource, isMpCostTarget } from "../../services/resource-consumption.mjs";
import { useAlchemy } from "../../use-cases/use-alchemy.mjs";
import { preparePhaseareaUse } from "../../services/phasearea.mjs";
import { assignActionTableEntry } from "../../services/action-table.mjs";
import { bookmarkItem, toggleItemBookmark } from "../../services/item-bookmarks.mjs";
import { applyItemEffects, applyEffectsToTokens, applyPreparedEffectsToTokens } from "../../services/effect-application.mjs";
import { resolveActorCheck } from "../../use-cases/actor-checks.mjs";
import { createActorCheckRequest, prepareMonsterCheckRequest, revealMonsterData } from "../../services/actor-check-requests.mjs";
import { resolveActorPower } from "../../use-cases/actor-power-rolls.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SW25ActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw25", "sheet", "actor"],
      width: 800,
      height: 700,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "abilityskill",
        },
        {
          navSelector: ".sidebar-tabs",
          contentSelector: ".sidebar-body",
          initial: "status",
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/sw25-lunachil-maintained/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    return prepareActorSheetContext(this.actor, super.getData());
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on("click", ".item-edit", (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Open item details
    html.find(".item-label").click(this._showItemDetails.bind(this));
    html.find(".spelllist-label").click(this._showSpellList.bind(this));
    html.find(".spell-label").click(this._showSpellDetails.bind(this));
    html.find(".action-label").click(this._showActionDetails.bind(this));

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on("click", ".item-create", this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on("click", ".item-delete", (ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.on("click", ".effect-control", (ev) => {
      const row = ev.currentTarget.closest("li");
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // exec Item Macro.
    html.on("click", ".execitemmacro", this._onItemMacro.bind(this));
    
    // Rollable abilities.
    html.on("click", ".rollable", this._onRoll.bind(this));

    // Rollable abilities for Power Roll.
    html.on("click", ".powerrollable", this._onPowerRoll.bind(this));

    // Roll request
    html.on("click", ".rollreq", this._onRollRequest.bind(this));

    // Apply effect.
    html.on("click", ".applyeffect", this._onApplyEffect.bind(this));

    // Mp cost.
    html.on("click", ".mpcost", this._onMpCost.bind(this));

    // Hp cost.
    html.on("click", ".hpcost", this._onHpCost.bind(this));

    // Resource cost.
    html.on("click", ".resourcecost", this._onResourceCost.bind(this));

    // Loot roll.
    html.on("click", ".lootrollable", this._onLootRoll.bind(this));

    // use Phasearea.
    html.on("click", ".usephasearea", this._onUsePhasearea.bind(this));

    // Lifeline add.
    html.on("click", ".lifelineadd", this._onLifelineAdd.bind(this));

    // Lifeline reset.
    html.on("click", ".lifelinereset", this._onLifelineReset.bind(this));

    // Material card cost.
    html.on("click", ".materialcardcost", this._onMaterialcardCost.bind(this));

    // Notes get.
    html.on("click", ".notesget", this._onNotesGet.bind(this));

    // Notes cost.
    html.on("click", ".notescost", this._onNotesCost.bind(this));

    // Notes add cost.
    html.on("click", ".notesaddget", this._onNotesAddGet.bind(this));

    // Notes reset.
    html.on("click", ".notesreset", this._onNotesReset.bind(this));

    // Tacspower get.
    html.on("click", ".tacspowerget", this._onTacspowerGet.bind(this));

    // Tacspower cost.
    html.on("click", ".tacspowercost", this._onTacspowerCost.bind(this));

    // Tacspower reset.
    html.on("click", ".tacspowerreset", this._onTacspowerReset.bind(this));

    // Popularity roll.
    html.on("click", ".popularityrollable", this._onPopularityRoll.bind(this));

    // Preemptive roll.
    html.on("click", ".preemptiverollable", this._onPreEmptiveRoll.bind(this));

    // Change Permission.
    html.on("click", ".changepermission", this._onChangePermission.bind(this));

    // Change Permission.
    html.on("click", ".changebookmark", this._onChangeBookmark.bind(this));

    // bookmark-scroll
    const outer = html.find("#bookmark-outer")[0];
    const inner = html.find("#bookmark-inner")[0];
    let currentOffset = 0;
    const scrollAmount = 116;

    html.find(".scroll-button.left").on("click", () => {
      currentOffset = Math.min(currentOffset + scrollAmount, 0); // 左限界
      inner.style.transform = `translateX(${currentOffset}px)`;
    });

    html.find(".scroll-button.right").on("click", () => {
      const maxOffset = -(inner.scrollWidth - outer.clientWidth);
      currentOffset = Math.max(currentOffset - scrollAmount, maxOffset); // 右限界
      inner.style.transform = `translateX(${currentOffset}px)`;
    });

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Change Input Area
    html.on("change", ".qt-change", this._changeQuantity.bind(this));
    html.on("change", ".sl-change", this._changeSkillLevel.bind(this));
    html.on("change", ".sc-change", this._changeSkillMod.bind(this));
    html.on("change", ".cm-change", this._changeCheckMod.bind(this));
    html.on("change", ".cm1-change", this._changeCheckMod1.bind(this));
    html.on("change", ".cm2-change", this._changeCheckMod2.bind(this));
    html.on("change", ".cm3-change", this._changeCheckMod3.bind(this));
    html.on("change", ".pm-change", this._changePowerMod.bind(this));
    html.on("change", ".eq-change", this._changeEquip.bind(this));
    html.on("change", ".rd-change", this._changeReading.bind(this));
    html.on("change", ".cv-change", this._changeConversation.bind(this));

    // Change Button
    html.find(".adjustment-button").click(this._onAdjustmentButton.bind(this));
    html.find(".quantity-button").click(this._onQuantityButton.bind(this));
    html.find(".changesl-button").click(this._onSkilllevelButton.bind(this));
    html.find(".checkmod-button").click(this._onCheckmodButton.bind(this));
    html.find(".roll-ability-check").click(this._onGrowthCheck.bind(this));
    html.find(".roll-actiontable").click(this._onActionTable.bind(this));

    // Drag action item to table
    html.find(`.actiontable`).on("drop", this._onActionTableDrag.bind(this));

    // Fairy contract check
    html.find(".fairy-contract").on("click", async (ev) => {
      const target = ev.currentTarget;
      const dataPath = target.dataset.path;
      const currentState = getProperty(this.actor, dataPath) || false;

      await this.actor.update({ [dataPath]: !currentState });
      target.classList.toggle("checked", !currentState);
    });

    const dropArea = html.find(".bookmark-drop-area");
    if (dropArea.length > 0) {
      dropArea.on("drop", this._onBookmarkDrop.bind(this));
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = foundry.utils.duplicate(header.dataset);
    // Initialize a default name.
    const name = game.i18n.format("DOCUMENT.New", {
      type: game.i18n.localize(`TYPES.Item.${type}`),
    });
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemMacro(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const itemId =
      dataset.itemid ??
      event.currentTarget.closest("[data-item-id]")?.dataset.itemId ??
      null;
      
    // Handle item macro.
    const item = this.actor.items.get(itemId);
    if (!item) return;
    item.executeMacro(event);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    const element = event.currentTarget;
    const dataset = element.dataset;
    const targetTokens = game.user.targets;
    if (dataset.apply == "-" || !dataset.apply || targetTokens.size === 0) {
      await this._onRollExec(event);
      return;
    } else {
      let label = dataset.label ? `${dataset.label}` : "";
      const targetRoll = await targetRollDialog(targetTokens, label);
      if (targetRoll == "cancel") {
        return;
      } else if (targetRoll == "once") {
        await this._onRollExec(event, targetTokens);
        return;
      } else if (targetRoll == "individual") {
        let chatMessageId = [];
        for (const [index, token] of Array.from(targetTokens).entries()) {
          const targetToken = new Set([token]);
          await this._onRollExec(event, targetToken).then((result) => {
            chatMessageId.push(result.chatMessageId);
          });
        }

        await postApplyAll(this.actor, dataset, label, chatMessageId, "checktype");
        return;
      }
    }

    await this._onRollExec(event);
  }
  async _onRollExec(event, targetTokens) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const itemId =
      dataset.itemid ??
      event.currentTarget.closest("[data-item-id]")?.dataset.itemId ??
      null;
      
    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == "item") {
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      const result = await resolveActorCheck(this.actor, {
        formula: dataset.roll,
        itemId,
        resourceId: dataset.resuse,
        resourceAmount: dataset.resusequantity,
      });
      const { resourceCost } = result;
      if (resourceCost && !resourceCost.consumed) {
        ui.notifications.warn(
          game.i18n.localize("SW25.Item.Noresquantitiywarn") + resourceCost.name
        );
        return;
      }

      return postActorCheck(this.actor, dataset, result, targetTokens);
    }
  }

  /**
   * Handle clickable power rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onPowerRoll(event) {
    const element = event.currentTarget;
    const dataset = element.dataset;
    const targetTokens = game.user.targets;
    if (dataset.apply == "-" || !dataset.apply || targetTokens.size === 0) {
      await this._onPowerRollExec(event);
      return;
    } else {
      let label = dataset.label ? `${dataset.label}` : "";
      const targetRoll = await targetRollDialog(targetTokens, label);
      if (targetRoll == "cancel") {
        return;
      } else if (targetRoll == "once") {
        await this._onPowerRollExec(event, targetTokens);
        return;
      } else if (targetRoll == "individual") {
        let chatMessageId = [];
        for (const [index, token] of Array.from(targetTokens).entries()) {
          const targetToken = new Set([token]);
          await this._onPowerRollExec(event, targetToken).then((result) => {
            chatMessageId.push(result.chatMessageId);
          });
        }

        await postApplyAll(this.actor, dataset, label, chatMessageId, "powertype");
        return;
      }
    }

    await this._onPowerRollExec(event);
  }
  async _onPowerRollExec(event, targetTokens) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const itemId =
      dataset.itemid ??
      event.currentTarget.closest("[data-item-id]")?.dataset.itemId ??
      null;
    const result = await resolveActorPower(this.actor, {
      formula: dataset.roll,
      powerTable: dataset.pt.split(","),
      itemId,
    });

    return postActorPower(this.actor, dataset, result, targetTokens);
  }

  async _onApplyEffect(event) {
    event.preventDefault();
    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    const orgActor = this.actor.name;
    const orgId = this.actor._id;
    const targetedToken = game.user.targets;

    // if no target,show dialog
    if (!item.system.selfbuff && targetedToken.size === 0) {
      const title = `${item.name} (${game.i18n.localize("SW25.Effectslong")})`;
      const selectedTokens = await targetSelectDialog(title);
      selectedTokens.forEach((token) => game.user.targets.add(token));
      if (!selectedTokens) {
        return;
      }
    }

    const { targetNames, effectNames } = applyItemEffects(
      this.actor, item, game.user.targets, orgActor, orgId
    );

    // reset target
    game.user.targets.forEach((target) => target.setTarget(false));

    await postAppliedEffects(this.actor, targetNames, effectNames);
  }

  async _onMpCost(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const selectedTokens = await Util.getControlledActor(this.actor);

    if (selectedTokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("SW25.Noselectwarn"));
      return;
    } else if (selectedTokens.length > 1) {
      ui.notifications.warn(game.i18n.localize("SW25.Multiselectwarn"));
      return;
    }
    const token = selectedTokens[0];
    const cost = dataset.cost;
    const name = dataset.label;
    const type = dataset.type;
    const id = dataset.id;
    const meta = 1;

    if (!isMpCostTarget(token.actor, { sourceActorId: id, type })) {
      ui.notifications.warn(game.i18n.localize("SW25.SummonMpwarn"));
      return;
    }
    
    mpCost(token, cost, name, type, meta);
  }

  async _onHpCost(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const selectedTokens = await Util.getControlledActor(this.actor);

    if (selectedTokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("SW25.Noselectwarn"));
      return;
    } else if (selectedTokens.length > 1) {
      ui.notifications.warn(game.i18n.localize("SW25.Multiselectwarn"));
      return;
    }
    const token = selectedTokens[0];
    const cost = dataset.cost;
    const max = dataset.max;
    const name = dataset.label;
    const type = dataset.type;
    hpCost(token, cost, max, name, type);
  }

  async _onResourceCost(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    if (!dataset.resuse) return;

    const resource = this.actor.items.get(dataset.resuse);
    const result = await consumeResource(resource, dataset.resusequantity);
    if (!result.consumed) {
      ui.notifications.warn(
        game.i18n.localize("SW25.Item.Noresquantitiywarn") + resource.name
      );
      return;
    }

    postResourceCost(speaker, resource.name, result);
  }

  async _onLootRoll(event) {
    event.preventDefault();
    lootRoll(this.actor);
  }

  async _onRollRequest(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const request = createActorCheckRequest(dataset.label, dataset.value);
    await postActorCheckRequest(this.actor, request);
  }

  async _onPopularityRoll(event) {
    event.preventDefault();
    await this._requestMonsterCheck("knowledge");
  }

  async _onPreEmptiveRoll(event) {
    event.preventDefault();
    await this._requestMonsterCheck("initiative");
  }

  async _onChangePermission(event) {
    event.preventDefault();
    await revealMonsterData(this.actor);
    postMonsterReveal(this.actor);
  }

  async _requestMonsterCheck(kind) {
    const { request, isView } = await prepareMonsterCheckRequest(this.actor, kind);
    await postMonsterCheckRequest(this.actor, kind, request, isView);
  }



  async _showItemDetails(event) {
    event.preventDefault();
    const toggler = $(event.currentTarget);
    const item = toggler.parents(".item");
    const description = item.find(".item-description");

    toggler.toggleClass("open", false);
    description.slideToggle();
  }

  async _showSpellList(event) {
    event.preventDefault();
    const toggler = $(event.currentTarget);
    const item = toggler.parents(".item");
    const description = item.find(".spelllist-description");

    toggler.toggleClass("open", false);
    description.slideToggle();
  }

  async _showSpellDetails(event) {
    event.preventDefault();
    const toggler = $(event.currentTarget);
    const item = toggler.parents(".spell");
    const description = item.find(".spell-description");

    toggler.toggleClass("open", false);
    description.slideToggle();
  }

  async _showActionDetails(event) {
    event.preventDefault();
    const toggler = $(event.currentTarget);
    const item = toggler.parents(".action");
    const description = item.find(".action-description");

    toggler.toggleClass("open", false);
    description.slideToggle();
  }

  async _onAdjustmentButton(event) {
    event.preventDefault();
    const action = event.currentTarget.dataset.action;
    const input = event.currentTarget.parentElement.querySelector("input");

    if (action === "decrease")
      isNaN(input.valueAsNumber) || !input.valueAsNumber
        ? (input.valueAsNumber = -1)
        : (input.valueAsNumber -= 1);
    else if (action === "increase")
      isNaN(input.valueAsNumber) || !input.valueAsNumber
        ? (input.valueAsNumber = 1)
        : (input.valueAsNumber += 1);

    this.submit();
  }

  async _onQuantityButton(event) {
    event.preventDefault();
    const action = event.currentTarget.dataset.action;
    const input = event.currentTarget.closest("li").querySelector("input.qt-change");
    const property = event.currentTarget.dataset.property;
    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );

    let quantity = parseInt(input.value);
    if (isNaN(quantity)) quantity = 0;
    if (action === "decrease") quantity -= 1;
    else if (action === "increase") quantity += 1;

    const limited = limitResourceQuantity(item, quantity);
    quantity = limited.quantity;
    for (const limit of limited.limits) {
      const key = limit === "max" ? "SW25.isAlreadyMax" : "SW25.isAlreadyMin";
      ui.notifications.warn(`"${item.name}"${game.i18n.localize(key)}`);
    }

    input.value = quantity;

    if (item) {
      const data = {};
      data[property] = quantity;
      await item.update(data);
      this._updateQuantity(item, quantity);
    }

    this.submit();
  }

  async _changeQuantity(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newQuantity = Number(event.currentTarget.value);
    await this._updateQuantity(item, newQuantity);
  }

  async _updateQuantity(item, quantity) {
    await item.update({ "system.quantity": quantity });
  }

  async _onSkilllevelButton(event) {
    event.preventDefault();
    const action = event.currentTarget.dataset.action;
    const input = event.currentTarget.closest("li").querySelector("input.sl-change");
    const property = event.currentTarget.dataset.property;
    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );

    let skilllevel = parseInt(input.value);
    if (isNaN(skilllevel)) skilllevel = 0;
    if (action === "decrease") skilllevel -= 1;
    else if (action === "increase") skilllevel += 1;

    input.value = skilllevel;

    if (item) {
      const data = {};
      data[property] = skilllevel;
      await item.update(data);
      this._updateSkilllevel(item, skilllevel);
    }

    this.submit();
  }

  async _changeSkillLevel(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newSkillLevel = Number(event.currentTarget.value);
    item.update({ "system.skilllevel": newSkillLevel });
  }

  async _updateSkilllevel(item, skilllevel) {
    await item.update({ "system.skilllevel": skilllevel });
  }

  async _changeSkillMod(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newSkillMod = Number(event.currentTarget.value);
    if (newSkillMod == 0) newSkillMod = null;
    item.update({ "system.skillmod": newSkillMod });
  }
  async _onCheckmodButton(event) {
    event.preventDefault();
    const action = event.currentTarget.dataset.action;
    const input = event.currentTarget.closest("li").querySelector("input.cm-change");
    const property = event.currentTarget.dataset.property;
    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );

    let checkmod = parseInt(input.value);
    if (isNaN(checkmod)) checkmod = 0;
    if (action === "decrease") checkmod -= 1;
    else if (action === "increase") checkmod += 1;

    input.value = checkmod;

    if (item) {
      const data = {};
      data[property] = checkmod;
      await item.update(data);
      this._updateCheckmod(item, checkmod);
    }

    this.submit();
  }

  async _changeCheckMod(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newCheckMod = Number(event.currentTarget.value);
    if (newCheckMod == 0) newCheckMod = null;
    item.update({ "system.checkmod": newCheckMod });
  }
  async _updateCheckmod(item, checkmod) {
    await item.update({ "system.checkmod": checkmod });
  }

  async _changeCheckMod1(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newCheckMod = Number(event.currentTarget.value);
    if (newCheckMod == 0) newCheckMod = null;
    item.update({ "system.checkmod1": newCheckMod });
  }

  async _updateCheckmod(item, checkmod) {
    await item.update({ "system.checkmod1": checkmod });
  }

  async _changeCheckMod2(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newCheckMod = Number(event.currentTarget.value);
    if (newCheckMod == 0) newCheckMod = null;
    item.update({ "system.checkmod2": newCheckMod });
  }
  
  async _updateCheckmod(item, checkmod) {
    await item.update({ "system.checkmod2": checkmod });
  }

  async _changeCheckMod3(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newCheckMod = Number(event.currentTarget.value);
    if (newCheckMod == 0) newCheckMod = null;
    item.update({ "system.checkmod3": newCheckMod });
  }

  async _updateCheckmod(item, checkmod) {
    await item.update({ "system.checkmod3": checkmod });
  }

  async _changePowerMod(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newPowerMod = Number(event.currentTarget.value);
    if (newPowerMod == 0) newPowerMod = null;
    item.update({ "system.powermod": newPowerMod });
  }

  async _updatePowermod(item, powermod) {
    await item.update({ "system.powermod": powermod });
  }

  async _changeEquip(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newEquip = event.currentTarget.checked;
    item.update({ "system.equip": newEquip });
  }

  async _updateEquip(item, equip) {
    await item.update({ "system.equip": equip });
  }

  async _changeReading(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newReading = event.currentTarget.checked;
    item.update({ "system.reading": newReading });
  }

  async _updateReading(item, reading) {
    await item.update({ "system.reading": reading });
  }

  async _changeConversation(event) {
    event.preventDefault();

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let newConversation = event.currentTarget.checked;
    item.update({ "system.conversation": newConversation });
  }

  async _updateConversation(item, conversation) {
    await item.update({ "system.conversation": conversation });
  }

  async _onGrowthCheck(event) {
    event.preventDefault();
    growthCheck(this.actor);
  }

  async _onActionTable(event) {
    event.preventDefault();
    const element = event.currentTarget;
    actionRoll(element, this.actor);
  }

  async _onActionTableDrag(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const data = JSON.parse(
      event.originalEvent.dataTransfer.getData("text/plain")
    );
    const item = await fromUuid(data.uuid);
    if (!item) return;
    if (item.type != "action") return;

    if (!this.actor.items.get(item.id)) event.stopPropagation();
    await assignActionTableEntry(this.actor, item, dataset.area);
  }

  async _selectApplyTarget(event, item, targetEffects, orgActor, orgId) {
    return showEffectTargetDialog(item.name, (tokens) => {
      applyEffectsToTokens(tokens, targetEffects, orgActor, orgId);
    });
  }

  async _onUsePhasearea(event) {
    event.preventDefault();
    const selectedTokens = await Util.getControlledActor(this.actor);
    if (selectedTokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("SW25.Noselectwarn"));
      return;
    } else if (selectedTokens.length > 1) {
      ui.notifications.warn(game.i18n.localize("SW25.Multiselectwarn"));
      return;
    }

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    let cost = item.system.mincost ? item.system.mincost : 0;

    if (item.system.maxcost && item.system.mincost != item.system.maxcost) {
      this._inputUsePhaseareaCost(item);
    } else {
      this._applyPhasearea(item, cost);
    }
  }

  async _applyPhasearea(item, cost) {
    const selectedTokens = await Util.getControlledActor(this.actor);

    if (selectedTokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("SW25.Noselectwarn"));
      return;
    } else if (selectedTokens.length > 1) {
      ui.notifications.warn(game.i18n.localize("SW25.Multiselectwarn"));
      return;
    }

    const orgActor = this.actor.name;
    const orgId = this.actor._id;
    const name =
      item.name +
      game.i18n.localize("SW25.Use") +
      " " +
      cost +
      game.i18n.localize("SW25.Item.Phasearea.Point");
    const { effects, consumed } = await preparePhaseareaUse(this.actor, item, cost, name);

    let lifeline = "";
    if (item.system.type == "ten") {
      lifeline = "Ten";
    } else if (item.system.type == "chi") {
      lifeline = "Chi";
    } else if (item.system.type == "jin") {
      lifeline = "Jin";
    }

    if (!consumed) {
      ui.notifications.warn(
        game.i18n.localize("SW25.NotResource") +
          ":" +
          game.i18n.localize(`SW25.Item.Phasearea.${lifeline}`)
      );
    }

    applyPreparedEffectsToTokens(selectedTokens, effects, orgActor, orgId);

    await postPhaseareaEffect(this.actor, selectedTokens[0].actor.name, effects[0].name, lifeline);
  }

  async _inputUsePhaseareaCost(item) {
    showPhaseareaCostDialog({
      name: item.name, minimum: item.system.mincost, maximum: item.system.maxcost,
    }, (cost) => this._applyPhasearea(item, cost));
  }

  async _onMaterialcardCost(event) {
    event.preventDefault();
    const selectedTokens = await Util.getControlledActor(this.actor);

    if (selectedTokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("SW25.Noselectwarn"));
      return;
    } else if (selectedTokens.length > 1) {
      ui.notifications.warn(game.i18n.localize("SW25.Multiselectwarn"));
      return;
    }

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );

    const rankLabel = event.target.textContent.trim();
    const useRank = rankLabel.toLowerCase();
    const results = await useAlchemy(this.actor, item, useRank);
    await postAlchemyCost(this.actor, item.name, rankLabel, results);
  }

  async _onNotesGet(event) {
    event.preventDefault();
    const selectedTokens = await Util.getControlledActor(this.actor);

    if (selectedTokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("SW25.Noselectwarn"));
      return;
    } else if (selectedTokens.length > 1) {
      ui.notifications.warn(game.i18n.localize("SW25.Multiselectwarn"));
      return;
    }

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );

    const missingResources = await gainNotes(this.actor, item);
    this._notifyMissingResources(missingResources);
  }

  async _onNotesCost(event) {
    event.preventDefault();
    const selectedTokens = await Util.getControlledActor(this.actor);

    if (selectedTokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("SW25.Noselectwarn"));
      return;
    } else if (selectedTokens.length > 1) {
      ui.notifications.warn(game.i18n.localize("SW25.Multiselectwarn"));
      return;
    }

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );

    const missingResources = await spendNotes(this.actor, item);
    this._notifyMissingResources(missingResources);
  }

  async _onNotesAddGet(event) {
    event.preventDefault();
    const selectedTokens = await Util.getControlledActor(this.actor);

    if (selectedTokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("SW25.Noselectwarn"));
      return;
    } else if (selectedTokens.length > 1) {
      ui.notifications.warn(game.i18n.localize("SW25.Multiselectwarn"));
      return;
    }

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );

    const missingResources = await gainAdditionalNotes(this.actor, item);
    this._notifyMissingResources(missingResources);
  }

  async _onTacspowerGet(event) {
    event.preventDefault();
    const selectedTokens = await Util.getControlledActor(this.actor);

    if (selectedTokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("SW25.Noselectwarn"));
      return;
    } else if (selectedTokens.length > 1) {
      ui.notifications.warn(game.i18n.localize("SW25.Multiselectwarn"));
      return;
    }

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );

    const missingResources = await gainTacspower(this.actor, item);
    this._notifyMissingResources(missingResources);
  }

  async _onTacspowerCost(event) {
    event.preventDefault();
    const selectedTokens = await Util.getControlledActor(this.actor);

    if (selectedTokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("SW25.Noselectwarn"));
      return;
    } else if (selectedTokens.length > 1) {
      ui.notifications.warn(game.i18n.localize("SW25.Multiselectwarn"));
      return;
    }

    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );

    const missingResources = await spendTacspower(this.actor, item);
    this._notifyMissingResources(missingResources);
  }

  async _onNotesReset(event) {
    event.preventDefault();

    await this._updateAllResource({type: "note"}, null);
  }

  async _onLifelineReset(event) {
    event.preventDefault();

    await this._updateAllResource({type: "lifeline"}, null);
  }

  async _onLifelineAdd(event) {
    event.preventDefault();

    await this._updateAllResource({type: "lifeline"}, 1);
  }

  async _onTacspowerReset(event) {
    event.preventDefault();

    await this._updateAllResource({type: "tacspower"}, null);
  }

  _notifyMissingResources(missingResources) {
    missingResources.forEach(() => {
      ui.notifications.warn(game.i18n.localize("SW25.NotResource"));
    });
  }

  async _updateAllResource(resourceType, modifyValue, multiple = 1) {
    const updated = await updateAllResourceQuantities(
      this.actor, resourceType, modifyValue, multiple
    );
    if (!updated) {
      ui.notifications.warn(game.i18n.localize("SW25.NotResource"));
    }
  }

  async render(force = false, options = {}) {
    let scrollPositions = this.getScrollPositions(this.element);

    const rendered = await super.render(force, options);

    setTimeout(() => {
      if (this.element?.length) {
        this.setScrollPositions(this.element, scrollPositions);
      }
    }, 10);

    return rendered;
  }

    
  getScrollPositions(html) {
    const positions = {};
    let tmpCnt = 0;
    html.find('[data-scrollable="true"]').each((i, element) => {
      const id = element.id || `scrollable-${i}`;
      positions[id] = element.scrollTop;
      tmpCnt += element.scrollTop;
    });
    return tmpCnt > 0 ? positions : null;
  }

  setScrollPositions(html, positions) {
    html.find('[data-scrollable="true"]').each((i, element) => {
      const id = element.id || `scrollable-${i}`;
      if (positions?.[id] !== undefined) {
        element.scrollTop = positions[id];
      }
    });
  }
  async _onBookmarkDrop(event) {
    event.preventDefault();

    const data = JSON.parse(event.originalEvent.dataTransfer.getData("text/plain"));
    if (data.type !== "Item") return;

    const droppedItem = await fromUuid(data.uuid ?? data.data?.uuid);
    if (!droppedItem) return;

    await bookmarkItem(this.actor, droppedItem);
  }

  async _onDropItem(event, data) {
    const isBookmarkDrop = event.target.closest(".bookmark-drop-area");
    if (!isBookmarkDrop) {
      return super._onDropItem(event, data);
    }

    const droppedItem = await fromUuid(data.uuid ?? data.data?.uuid);
    if (!droppedItem) return;

    await bookmarkItem(this.actor, droppedItem);

    return;
  }

  async _onChangeBookmark(event) {
    event.preventDefault();
    const changeItem = $(event.currentTarget);
    const item = this.actor.items.get(
      changeItem.parents(".item")[0].dataset.itemId
    );
    toggleItemBookmark(item);
  }

}
