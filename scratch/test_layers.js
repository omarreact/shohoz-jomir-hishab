const fetchLayers = async () => {
  const url = `http://localhost:3000/api/rajuk-proxy?where=1=1&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer`;
  try {
    // We actually need to fetch the root metadata, but our proxy requires where and appends /query.
    // Let's just fetch the root directly using raw fetch (without the proxy).
    const directUrl = "https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer?f=json";
    const res = await fetch(directUrl, { headers: { 'Referer': 'https://masterplan.rajuk.gov.bd' } });
    const data = await res.json();
    console.log("Layers:");
    data.layers.forEach(l => console.log(l.id, l.name));
  } catch(e) {
    console.error(e);
  }
};
fetchLayers();
