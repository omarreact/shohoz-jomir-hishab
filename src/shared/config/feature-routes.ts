export const FEATURE_ROUTES = {
  home: "/",
  records: "/khatiyan",
  landMeasurement: "/land-measurement",
  inheritance: "/faraez",
  landMap: "/dap-map",
  documents: "/porcha",
  blog: "/blog",
  faq: "/faq",
  admin: "/admin",
} as const;

export type FeatureRouteKey = keyof typeof FEATURE_ROUTES;
