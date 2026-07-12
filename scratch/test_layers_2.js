const fetchLayers = async () => {
  const url = `http://localhost:3000/api/rajuk-proxy?where=1=1&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Layers object:", Object.keys(data));
    if (data.layers) {
      data.layers.forEach(l => console.log(l.id, l.name));
    } else {
      console.log(data);
    }
  } catch(e) {
    console.error(e);
  }
};
fetchLayers();
