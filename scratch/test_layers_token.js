const testTokenLayers = async () => {
  const token = "a8G2bN9mqFsECE9ZUgn_Wj3vZ_onrRdJ9Uck8dMWUEJAngplExC6qmxnBmM5dy43LVIsOECYu9i8F54VT1NAmATukk2hpqNQ-bBUKkP8n-ikgO4h3lqwyT8JqmObUmH02YEWovUBiYLm9YcekvZqYFSlef8QeYK_uzL_-aHmN4Cc-N7G6sbxPY802-TtMeG1YARkUbEjqCvV3OdjcX08mNIvMWogQwxijPsxEgtfPvo1nDCQ78re67_CfV_rSb-oMHttBL1HFL-zz7hsqQl1ZqoPcieb3fn7qCahXWAZaozddsBRnLASXsM640VP4je7TZBOdRu9Nd_gG7Hc8jV5qg..";
  const layers = [
    "DAP_proposed_landuse",
    "RS_Mauza_Tiles_Final",
    "Transport_Network_Tiles",
    "flood_overlay_lvl11_20_aug_22"
  ];
  
  for (const layer of layers) {
    const url = `https://masterplan.rajuk.gov.bd/server/rest/services/Hosted/${layer}/MapServer?f=json&token=${token}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log(`${layer}:`, data.error ? data.error.message : (data.name || "Success"));
    } catch(e) {
      console.error(e);
    }
  }
};
testTokenLayers();
