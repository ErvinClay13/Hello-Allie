export const getAIResponse = async (prompt: string) => {
  try {
    const response = await fetch('https://hello-allie-backend.onrender.com/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const text = await response.text();
    console.log(" RAW AI RESPONSE:", text);

    const data = JSON.parse(text);
    return data.result;
  } catch (error) {
    console.error(" Error fetching AI response:", error);
    return "Sorry, something went wrong.";
  }
};
