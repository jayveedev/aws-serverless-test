export const main = async () => {
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
    body: JSON.stringify({
      message: 'Hello World from serverless starter template! Jayvee',
      timestamp: new Date().toISOString(),
      stage: process.env.STAGE || 'dev',
    }),
  };

  return response;
};
