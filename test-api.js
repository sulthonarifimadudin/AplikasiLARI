
const API_KEY = "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";

async function testOpenRouter() {
    console.log("Testing OpenRouter API...");
    console.log("Key:", API_KEY.slice(0, 10) + "...");

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://esterun.app",
                "X-Title": "Este.RUN"
            },
            body: JSON.stringify({
                "model": "deepseek/deepseek-chat",
                "messages": [
                    { "role": "user", "content": "Hello, are you online?" }
                ]
            })
        });

        console.log("Status:", response.status);
        const data = await response.json();

        if (!response.ok) {
            console.error("ERROR RESPONSE:", JSON.stringify(data, null, 2));
        } else {
            console.log("SUCCESS:", data.choices[0].message.content);
        }

    } catch (error) {
        console.error("FETCH ERROR:", error);
    }
}

testOpenRouter();
