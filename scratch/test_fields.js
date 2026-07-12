const fetchPlotAttributes = async () => {
  const token = "a8G2bN9mqFsECE9ZUgn_Wj3vZ_onrRdJ9Uck8dMWUEJAngplExC6qmxnBmM5dy43LVIsOECYu9i8F54VT1NAmATukk2hpqNQ-bBUKkP8n-ikgO4h3lqwyT8JqmObUmH02YEWovUBiYLm9YcekvZqYFSlef8QeYK_uzL_-aHmN4Cc-N7G6sbxPY802-TtMeG1YARkUbEjqCvV3OdjcX08mNIvMWogQwxijPsxEgtfPvo1nDCQ78re67_CfV_rSb-oMHttBL1HFL-zz7hsqQl1ZqoPcieb3fn7qCahXWAZaozddsBRnLASXsM640VP4je7TZBOdRu9Nd_gG7Hc8jV5qg..";
  
  const res = await fetch(`https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/0/query?f=json&where=1=1&outFields=*&resultRecordCount=1&token=${token}`);
  const data = await res.json();
  
  if (data.features?.length > 0) {
    console.log("Attributes available on RS Plot:");
    console.log(Object.keys(data.features[0].attributes));
  } else {
    console.log(data);
  }
};

fetchPlotAttributes();
