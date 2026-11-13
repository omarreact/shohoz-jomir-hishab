import { isVisitorChatHiddenOnRoute } from "./visitorChatVisibility";

describe("visitor AI chat visibility", () => {
  it.each([
    "/geospatial-map",
    "/geospatial-map/debug",
    "/mouza-map",
    "/mouza-map/export",
    "/rajuk-test",
  ])(
    "does not overlay the map workspace at %s",
    (path) => expect(isVisitorChatHiddenOnRoute(path)).toBe(true),
  );

  it.each(["/", "/dlrms-khatian", "/faraez", "/blog"])(
    "remains available outside map workspaces at %s",
    (path) => expect(isVisitorChatHiddenOnRoute(path)).toBe(false),
  );

  it("handles a missing pathname safely", () => {
    expect(isVisitorChatHiddenOnRoute(null)).toBe(false);
  });
});
