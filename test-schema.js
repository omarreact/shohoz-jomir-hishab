async function test() {
  const baseUrl = "https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/2?f=json";
  console.log("Fetching layer 2 schema...");
  const res = await fetch(baseUrl);
  const json = await res.json();
  const fields = json.fields ? json.fields.map(f => f.name) : "No fields found";
  console.log("Layer 2 fields:", fields);
}

test();
