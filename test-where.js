

async function testMassiveWhere() {
  const tokenRes = await fetch("http://localhost:3000/api/unified?include=location&limit=1"); // just to wake it up or something
  
  // We'll just manually hit the Rajuk feature provider
  const url = "https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/6/query";
  
  const guids = [];
  for(let i=0; i<300; i++) {
    guids.push(`M-{A3C645BD-7123-40DA-96D1-5BE71DFC9360}-${i}`); // fake guids
  }
  const where = guids.map(g => `p_guid='${g}'`).join(" OR ");
  console.log("Where length:", where.length);

  const params = new URLSearchParams({
    f: "json",
    where: where,
    outFields: "*",
    returnGeometry: "false",
    resultRecordCount: "1000",
    resultOffset: "0",
    // without token, but it might just return 499, which is fine, we want to see if it rejects due to size
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString()
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text.substring(0, 200));
}

testMassiveWhere();
