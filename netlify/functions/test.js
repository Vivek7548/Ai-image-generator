// Simple test function to verify Netlify Functions are working
exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Test function is working!",
      timestamp: new Date().toISOString(),
      event: {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: event.headers
      }
    })
  };
};