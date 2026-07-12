const urls = [
  "https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/0/query",
  "https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/6/query"
];

Promise.all(urls.map(url => 
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "f=json&where=1=1&outFields=*&resultRecordCount=1"
  }).then(res => res.json())
)).then(([geom, info]) => {
  console.log("GEOM LAYER (0) FIELDS:");
  console.log(geom.fields?.map(f => f.name).join(", "));
  console.log("\nINFO LAYER (6) FIELDS:");
  console.log(info.fields?.map(f => f.name).join(", "));
}).catch(err => console.error(err));
