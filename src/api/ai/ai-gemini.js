// Import Express for creating the server and node-fetch for making HTTP requests.
// node-fetch is used as a modern alternative to axios for making fetch requests in Node.js.
const express = require('express');
const fetch = require('node-fetch'); // Make sure to install node-fetch: npm install node-fetch

// Export a function that takes the Express app instance as an argument.
// This allows the API routes to be integrated into an existing Express application.
module.exports = function(app) {

    // Define the Gemini API endpoint and the model to use.
    // The API key will be provided by the environment, so it's initialized as an empty string.
    // Canvas will automatically inject the API key at runtime if it's left empty.
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const API_KEY = "AIzaSyBXH3c321wAbXr2dBpuMxrpFhMfZwkM_98"; // Leave this empty; Canvas will provide the API key at runtime.

    /**
     * Calls the Gemini AI API with the given prompt text.
     * @param {string} prompt The text prompt to send to the Gemini API.
     * @returns {Promise<string>} The generated text response from Gemini.
     * @throws {Error} If there's an error calling the Gemini API or parsing the response.
     */
    async function callGeminiAPI(prompt) {
        try {
            // Construct the payload for the Gemini API request.
            // The chat history is kept simple with just a user message.
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            };

            // Make the POST request to the Gemini API.
            const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Check if the response was successful.
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API request failed with status ${response.status}: ${errorText}`);
            }

            // Parse the JSON response.
            const result = await response.json();

            // Extract the generated text from the response.
            // This checks for the expected structure of the Gemini API response.
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else {
                // If the response structure is unexpected, throw an error.
                throw new Error('Unexpected response structure from Gemini API.');
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            throw error; // Re-throw the error for the calling route to handle.
        }
    }

    /**
     * Defines a GET endpoint for '/ai/gemini'.
     * This endpoint expects a 'text' query parameter.
     * It calls the Gemini API with the provided text and returns the result.
     */
    app.get('/ai/gemini', async (req, res) => {
        try {
            // Extract the 'text' query parameter from the request.
            const { text } = req.query;

            // Validate if the 'text' parameter is provided.
            if (!text) {
                return res.status(400).json({ status: false, error: 'Parameter "text" is required.' });
            }

            // Call the Gemini API with the user's text.
            const geminiResult = await callGeminiAPI(text);

            // Send a successful JSON response with the Gemini result.
            res.status(200).json({
                status: true,
                result: geminiResult
            });
        } catch (error) {
            // Handle any errors that occur during the request or API call.
            console.error("Error in /ai/gemini endpoint:", error);
            res.status(500).json({ status: false, error: error.message || 'Internal Server Error' });
        }
    });

    // Optional: You can add a basic root route for testing if the server is running.
    app.get('/', (req, res) => {
        res.send('Gemini AI API is running. Try accessing /ai/gemini?text=your_query');
    });
};

// To run this code, you would typically have an app.js or server.js file like this:
/*
const express = require('express');
const geminiApiRoutes = require('./geminiApi'); // Assuming this file is named geminiApi.js

const app = express();
const PORT = process.env.PORT || 3000;

// Apply the Gemini API routes to the Express app
geminiApiRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test with: http://localhost:${PORT}/ai/gemini?text=Halo%20dunia!`);
});
*/
