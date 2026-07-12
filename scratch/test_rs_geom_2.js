const testRsGeometry = async () => {
  const url1 = `http://localhost:3000/api/rajuk-proxy?where=1=1&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/1&outFields=rs_plot_no,mauza&resultRecordCount=1`;
  try {
    const res1 = await fetch(url1);
    const data1 = await res1.json();
    if (data1.features && data1.features.length > 0) {
      const f1 = data1.features[0];
      console.log("Found RS plot (layer 1):", f1.attributes);
    } else {
      console.log("No features in layer 1:", data1);
    }
  } catch(e) {
    console.error(e);
  }
};
testRsGeometry();
