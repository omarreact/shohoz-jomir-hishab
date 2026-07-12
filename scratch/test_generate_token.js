const testGenerateToken = async () => {
  const url = `https://masterplan.rajuk.gov.bd/portal/sharing/rest/generateToken`;
  const params = new URLSearchParams();
  params.append("request", "getToken");
  params.append("serverUrl", "https://masterplan.rajuk.gov.bd/server/rest/services/");
  params.append("referer", "https://masterplan.rajuk.gov.bd");
  params.append("f", "json");

  try {
    const res = await fetch(url, {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    const data = await res.json();
    console.log("Token response:", data);
  } catch(e) {
    console.error(e);
  }
};
testGenerateToken();
