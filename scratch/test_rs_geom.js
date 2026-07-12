const testRsGeometry = async () => {
  const url1 = `http://localhost:3000/api/rajuk-proxy?where=1=1&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/0&outFields=rs_plot_no,mauza&resultRecordCount=1`;
  try {
    const res1 = await fetch(url1);
    const data1 = await res1.json();
    if (data1.features && data1.features.length > 0) {
      const f1 = data1.features[0];
      console.log("Found RS plot:", f1.attributes);
      
      const rs_plot_no = f1.attributes.rs_plot_no;
      const mauza = f1.attributes.mauza;
      
      const url2 = `http://localhost:3000/api/rajuk-proxy?where=rs_plot_no='${rs_plot_no}' AND mauza='${mauza}'&servicePath=rajuk_db/Rajuk_dap_db/FeatureServer/0&outFields=*&returnGeometry=true&outSR=4326`;
      const res2 = await fetch(url2);
      const data2 = await res2.json();
      if (data2.features && data2.features.length > 0) {
        console.log("Has geometry for RS?", !!data2.features[0].geometry);
      }
    }
  } catch(e) {
    console.error(e);
  }
};
testRsGeometry();
