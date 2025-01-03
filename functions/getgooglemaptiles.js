
// Export the handler function
exports.handler = async (event) => {
    
    // Get the environment variable GOOGLE_MAPS_API_KEY 
    // that was created in netlify beforehand
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    

    const { lyrs, x, y, z } = event.queryStringParameters;
    const url = `https://mt1.google.com/vt/lyrs=${lyrs}&x=${x}&y=${y}&z=${z}&key=${apiKey}`;
  
    try {
      const response = await fetch(url);
  
      if (!response.ok) {
        // Safely parse JSON
        const errorData = await response.json().catch(() => ({}));

        if (errorData.error && errorData.error.message) {
          if (errorData.error.message.includes('quotaExceeded')) {
            console.error('Quota exceeded:', errorData.error.message);
            return {
              statusCode: 429,
              body: JSON.stringify({ error: 'API quota exceeded' }),
            };
          } else if (errorData.error.message.includes('rateLimitExceeded')) {
            console.error('Rate limit exceeded:', errorData.error.message);
            return {
              statusCode: 429,
              body: JSON.stringify({ error: 'API rate limit exceeded' }),
            };
          }
        }

        return {
          statusCode: response.status,
          body: JSON.stringify({ error: 'Failed to fetch tile data' }),
        };
      }
  
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
  
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'max-age=3600',
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true,
      };
    } catch (error) {
      console.error('Error fetching tile data:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server error' }),
      };
    }

  };