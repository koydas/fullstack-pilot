const MAX_LOG_EVENTS = 500;

const requestEvents = [];

export function addRequestEvent(event) {
  requestEvents.push(event);
  if (requestEvents.length > MAX_LOG_EVENTS) {
    requestEvents.shift();
  }
}

export function getRecentRequestEvents(limit = 100) {
  const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 100;
  const safeLimit = Math.max(1, Math.min(normalizedLimit, MAX_LOG_EVENTS));
  return requestEvents.slice(-safeLimit);
}
