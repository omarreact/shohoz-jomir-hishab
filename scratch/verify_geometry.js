const testFetch = async () => {
  const url = `http://localhost:3000/api/rajuk-proxy?where=rs_plot_no='123'&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/0&outFields=*&returnGeometry=true&outSR=4326`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Features length:", data.features?.length);
    if (data.features && data.features.length > 0) {
      console.log("Has geometry?", !!data.features[0].geometry);
      if (data.features[0].geometry) {
         console.log("Geometry rings length:", data.features[0].geometry.rings?.length);
      }
    } else {
      console.log("No features found or error:", data);
    }
  } catch (e) {
    console.error(e);
  }
};
testFetch();
