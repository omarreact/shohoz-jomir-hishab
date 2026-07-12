const testMsGeometryInRsLayer = async () => {
  const rsUrl = `http://localhost:3000/api/rajuk-proxy?where=ms_plot_no='2003'&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/0&outFields=*&returnGeometry=true&outSR=4326`;
  try {
    const res = await fetch(rsUrl);
    const data = await res.json();
    console.log("Found in RS Layer by ms_plot_no:", data.features?.length > 0);
    if (data.features?.length > 0) {
      console.log("Attributes:", data.features[0].attributes);
      console.log("Has Geometry:", !!data.features[0].geometry);
    }
  } catch (err) {
    console.error(err);
  }
};
testMsGeometryInRsLayer();
