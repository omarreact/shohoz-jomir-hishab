async function test() {
  const q1 = new URLSearchParams({ where: "mauza LIKE '%PATIRA%'", servicePath: "rajuk_db/Rajuk_dap_db/FeatureServer/2", outFields: "*", limit: "1" });
  const q2 = new URLSearchParams({ where: "plot_no=3922", servicePath: "rajuk_db/Rajuk_dap_db/FeatureServer/2", outFields: "*", limit: "1" });
  const q3 = new URLSearchParams({ where: "plot_no='3922'", servicePath: "rajuk_db/Rajuk_dap_db/FeatureServer/2", outFields: "*", limit: "1" });

  for (let [name, q] of [['mauza LIKE %PATIRA%', q1], ['plot_no=3922', q2], ["plot_no='3922'", q3]]) {
    const url = "https://landbd.pincodeit.com/api/rajuk-proxy?" + q.toString();
    try {
      const res = await fetch(url);
      const json = await res.json();
      console.log(name, "Status:", res.status);
      if (res.status !== 200) console.log(JSON.stringify(json));
    } catch(e) {
      console.error(e);
    }
  }
}
test();
