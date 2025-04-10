// Asynchronously fetch a response from the AI backend using the provided prompt
export const getAIResponse = async (prompt: string) => {
  try {
    // Send a POST request to the backend with the user's prompt
    const response = await fetch('https://hello-allie-backend.onrender.com/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Specify the content type as JSON
      },
      body: JSON.stringify({ prompt }), // Send the prompt in the request body
    });

    // Wait for the raw text response from the backend
    const text = await response.text();
    console.log(" RAW AI RESPONSE:", text); // Log raw response for debugging

    // Parse the JSON string response
    const data = JSON.parse(text);

    // Return the AI-generated result
    return data.result;
  } catch (error) {
    
    return "Sorry, something went wrong.";
  }
};
