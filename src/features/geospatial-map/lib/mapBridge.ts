/** Shared map handle so consent popup can flyTo after GPS grant. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapHandle: any = null;

export function registerLandbdMap(map: unknown) {
  mapHandle = map;
}

export function getLandbdMap() {
  return mapHandle;
}

export function clearLandbdMap() {
  mapHandle = null;
}
