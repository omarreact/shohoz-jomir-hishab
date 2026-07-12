import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Extract query parameters, e.g., ?mouzaName=Mirpur
  const { searchParams } = new URL(request.url);
  const mouzaName = searchParams.get('mouza');

  // NOTE: RAJUK's APIs require an authorization token. 
  // For production, you will need to find the token generation endpoint or use the token from the website.
  // In your HAR file, the token looked something like this:
  const TOKEN = "a8G2bN9mqFsECE9ZUgn_Wj3vZ_onrRdJ9Uck8dMWUEJAngplExC6qmxnBmM5dy43LVIsOECYu9i8F54VT1NAmATukk2hpqNQ-bBUKkP8n-ikgO4h3lqwyT8JqmObUmH02YEWovUBiYLm9YcekvZqYFSlef8QeYK_uzL_-aHmN4Cc-N7G6sbxPY802-TtMeG1YARkUbEjqCvV3OdjcX08mNIvMWogQwxijPsxEgtfPvo1nDCQ78re67_CfV_rSb-oMHttBL1HFL-zz7hsqQl1ZqoPcieb3fn7qCahXWAZaozddsBRnLASXsM640VP4je7TZBOdRu9Nd_gG7Hc8jV5qg..";

  // The FeatureServer endpoint for one of RAJUK's DAP databases
  // You can change /6/ to /7/ or /8/ to query different layers (e.g., buildings vs plots)
  const rajukApiUrl = `https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer/6/query`;

  try {
    // We build the query parameters to send to RAJUK's server
    const params = new URLSearchParams({
      f: 'json', // Request data in JSON format instead of Protobuf
      where: mouzaName ? `mouza_name = '${mouzaName}'` : '1=1', // SQL-like filter
      returnGeometry: 'true', // Set to true if you want the exact map coordinates (polygons)
      outFields: '*', // Request all available data columns
      resultRecordCount: '10', // Limit to 10 results for testing
      token: TOKEN // The authentication token
    });

    // Make the request to RAJUK's server
    const response = await fetch(`${rajukApiUrl}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://masterplan.rajuk.gov.bd',
        'Referer': 'https://masterplan.rajuk.gov.bd/'
      }
    });

    const data = await response.json();

    // Check if RAJUK rejected the request (e.g., invalid token)
    if (data.error) {
      return NextResponse.json(
        { success: false, message: "RAJUK API Error", error: data.error },
        { status: 400 }
      );
    }

    // Success! Return the data to our own frontend
    return NextResponse.json({
      success: true,
      message: "Data fetched successfully from RAJUK DAP",
      totalFeatures: data.features?.length || 0,
      data: data.features
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
