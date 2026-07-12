const testQuery = async () => {
  // A sample geometry from Mirpur area (Polgyon)
  const sampleGeom = {"rings":[[[90.36,23.82],[90.361,23.82],[90.361,23.821],[90.36,23.821],[90.36,23.82]]],"spatialReference":{"wkid":4326}};
  
  const params = new URLSearchParams({
    where: "1=1",
    geometry: JSON.stringify(sampleGeom),
    geometryType: "esriGeometryPolygon",
    spatialRel: "esriSpatialRelIntersects",
    inSR: "4326",
    outFields: "*"
  });

  const testLayer = async (name, path) => {
    try {
      // NOTE: For this test script, we bypass the next.js proxy and hit the real server just to see if the paths are valid.
      // Actually, since I don't have the token in the script, I should just hit the local next.js server!
      const url = `http://localhost:3000/api/rajuk-proxy?servicePath=${path}&${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      console.log(`--- ${name} ---`);
      if (data.error) console.log("ERROR:", data.error);
      else console.log(`Found ${data.features?.length || 0} intersecting features.`);
      if (data.features?.length > 0) {
         console.log("Sample attributes:", data.features[0].attributes);
      }
    } catch (e) {
      console.log(`Failed to fetch ${name}`, e.message);
    }
  };

  await testLayer("Landuse", "Hosted/DAP_proposed_landuse/MapServer/0");
  await testLayer("Flood", "Hosted/flood_overlay_lvl11_20/MapServer/0");
  await testLayer("Transport", "Hosted/Transport_Network_Tiles/MapServer/0");
};

testQuery();
