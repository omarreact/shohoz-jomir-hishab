async function test() {
  const baseUrl = "https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/2/query";
  const params = new URLSearchParams({
    f: "json",
    where: "UPPER(mauza) LIKE '%PATIRA%' AND plot_no='3922'",
    outFields: "*",
    returnGeometry: "false",
    resultRecordCount: "1",
    resultOffset: "0",
  });

  console.log("Fetching layer 2 info...");
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Content-Type": "application/x-www-form-urlencoded",
      "Referer": "https://masterplan.rajuk.gov.bd/",
    },
    body: params.toString()
  });

  const json = await res.json();
  console.log("Layer 2 response:", JSON.stringify(json, null, 2));
}

test();
