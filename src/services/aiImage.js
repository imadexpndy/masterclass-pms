/**
 * Service to generate images using Hugging Face Inference API
 */

export async function generateImageFromText(itemName, category, apiKey) {
    if (!apiKey) {
        throw new Error('No Hugging Face API key provided.');
    }

    // We use FLUX.1-schnell or stable-diffusion-xl-base-1.0
    // FLUX is very fast and high quality for free tier
    const MODEL_ID = 'black-forest-labs/FLUX.1-schnell';
    // The new HuggingFace inference endpoint structure
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

    // Prompt Engineering for food photography
    const prompt = `Professional food photography of ${itemName} ${category ? `(${category})` : ''}, high resolution, 4k, restaurant lighting, appetizing, centered on a clean plate or suitable background, photorealistic`;

    try {
        const response = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`API Error ${response.status}: ${errBody}`);
        }

        const blob = await response.blob();

        // Convert Blob to Base64 String to easily save in Dexie
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result); // This is the Base64 data: URL
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    } catch (error) {
        console.error('AI Image Generation Failed:', error);
        throw error;
    }
}
