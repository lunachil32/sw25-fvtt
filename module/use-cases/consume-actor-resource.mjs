import { consumeResource } from "../services/resource-consumption.mjs";

/** Consume an owned resource and return its display name with the outcome. */
export async function consumeActorResource(actor, resourceId, amount) {
  const resource = actor.items.get(resourceId);
  const result = await consumeResource(resource, amount);
  return { ...result, name: resource.name };
}
