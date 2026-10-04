import { chatButton } from "../../helpers/chatbutton.mjs";

const messageListeners = new WeakMap();

/** Register before the initial chat history is rendered, including on V12. */
export function registerChatMessageEvents() {
  if (game.release.generation >= 13) {
    Hooks.on("renderChatMessageHTML", bindChatMessageEvents);
  } else {
    Hooks.on("renderChatMessage", (message, html) => bindChatMessageEvents(message, html[0]));
  }
}

/** Use one delegated listener per rendered message, even when its contents change. */
export function bindChatMessageEvents(message, element) {
  const previous = messageListeners.get(element);
  if (previous) element.removeEventListener("click", previous);
  const listener = event => onMessageClick(event, message, element);
  element.addEventListener("click", listener);
  messageListeners.set(element, listener);
}

function onMessageClick(event, message, element) {
  const target = event.target instanceof Element ? event.target : event.target.parentElement;
  const button = target?.closest(".buttonclick");
  if (button && element.contains(button)) {
    if (button.matches(":disabled")) return;
    event.preventDefault();
    void chatButton(message, button.dataset.buttontype);
    return;
  }

  const flavor = target?.closest(".flavor-text");
  if (!flavor || !element.contains(flavor)) return;
  event.preventDefault();
  flavor.classList.remove("open");
  // Preserve the existing description animation; event registration uses native DOM.
  $(element).find(".chat-tooltip").slideToggle();
}
