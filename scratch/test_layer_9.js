const testLayer9 = async () => {
  const url1 = `http://localhost:3000/api/rajuk-proxy?where=1=1&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/9&outFields=*&resultRecordCount=1&returnGeometry=true&outSR=4326`;
  try {
    const res1 = await fetch(url1);
    const data1 = await res1.json();
    console.log("Layer 9 fields:");
    if (data1.features && data1.features.length > 0) {
      console.log(Object.keys(data1.features[0].attributes));
      console.log("Has geometry?", !!data1.features[0].geometry);
    } else {
      console.log(data1);
    }
  } catch(e) {
    console.error(e);
  }
};
testLayer9();
