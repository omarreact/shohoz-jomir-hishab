const fetchKnownPlot = async () => {
  const url = `http://localhost:3000/api/rajuk-proxy?where=rs_plot_no='1' AND UPPER(address_search) LIKE '%MIRPUR%'&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/0&outFields=*&returnGeometry=true&outSR=4326`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Found features:", data.features?.length);
    if (data.features && data.features.length > 0) {
      const f = data.features[0];
      console.log("Attributes Keys:", Object.keys(f.attributes));
      console.log("Has geometry?", !!f.geometry);
      if (f.geometry) {
         console.log("Geometry rings:", f.geometry.rings?.length);
      }
    }
  } catch(e) {
    console.error(e);
  }
};
fetchKnownPlot();
