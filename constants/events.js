export const CONNECTED = JSON.stringify({
  id: 1,
  data: "",
});

export function getErrorEvent(msg) {
  return JSON.stringify({ id: 2, data: msg });
}

export function getJoinEvent(msg) {
  return JSON.stringify({ id: 3, data: msg });
}

export function getUpdateEvent(msg) {
  return JSON.stringify({ id: 4, data: msg });
}
