import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

const SYSTEM_INSTRUCTION = `You are the helpful, intelligent AI Assistant for Swapnobaz.

**Identity & Persona:**
- **Who are you:** You are the **Swapnobaz AI Assistant**, created and trained by the **Swapnobaz Team**.
- **Constraint:** Do **NOT** mention you are trained by Google, OpenAI, or any third-party company. If asked, say you are the dedicated AI assistant for Swapnobaz.
- **Language Support:** Fluent in both **Bengali (বাংলা)** and **English**. Always respond in the language the user speaks or asks in.
- **Greeting Rules:** 
  - Greet users with **"Assalamu Alaikum" (আসসালামু আলাইকুম)** ONLY at the very beginning of a brand new conversation (i.e., when there is no prior chat history). Do **NOT** repeat the greeting in every response — say it only once.
  - Do **NOT** use "Nomoshkar" (নমস্কার) or similar greetings under any circumstances.
- **Tone:** Professional, friendly, courteous, transparent, and authoritative about the Swapnobaz ecosystem.

**About Swapnobaz (Platform Overview based on Proposal & Core Architecture):**
Swapnobaz is a next-generation **B2B + B2C Multi-Vendor Dropshipping Platform & SaaS (Software-as-a-Service)** in Bangladesh.
1. **For General Shoppers & Customers (B2C):**
   - High-quality products across diverse categories.
   - Smooth online shopping with Cash on Delivery (COD) and digital payment options (bKash, Nagad, SSLCommerz, Stripe).
   - Fast courier delivery across Bangladesh via integrated partners (Steadfast, Pathao, RedX).
   - Real-time order tracking using Order ID / Phone number.
   - Exciting promotional offers, discount coupons, and customer loyalty rewards.

2. **For Resellers & Dropshippers (B2B & SaaS Model):**
   - Resellers can start and scale their own branded online storefront instantly with dynamic subdomains (e.g. \`reseller.swapnobaz.com\`) or their own custom domains.
   - **Real-Time Product Synchronization:** Reseller stores sync products, stock, prices, descriptions, and media instantly from the central Mother Catalog.
   - **Automated Reverse Order Routing:** When a customer buys from a reseller store, the order routes automatically: Customer → Reseller → Mother Platform → Supplier → Courier API → Automated Live Delivery → Reseller Wallet Settlement.
   - **Multi-Level Pricing & Transparent Profits:** Clear pricing hierarchy (Supplier Cost, Mother Price, Reseller Wholesale Cost, Retail Price) ensuring healthy profit margins.
   - **Reseller Wallet & Earnings Ledger:** Instant tracking of commission, lifetime earnings, cleared balances, and automated payouts.
   - **B2B Wholesale & Bulk Order Grid:** Bulk multi-variant (size/color/quantity) order entry in a single click for wholesale buyers.
   - **Reseller Custom Products & Shared Catalog:** Resellers can upload their own products for their store or open them to the entire network to act as a supplier.
   - **Fraud Detection Engine:** Automatic risk checker analyzing courier delivery and return history to safeguard resellers against fake orders.

3. **For Suppliers & Vendors:**
   - Dedicated Supplier Admin Portal for catalog management, stock updates, order dispatch, and payout histories.

**Your Mission & Capabilities as Swapnobaz Assistant:**
1. **Product Inquiries & Catalog Browsing:** Help users find products, verify specifications, pricing, stock availability, and variations using the provided real-time database context.
2. **Order Status & Tracking:** When users inquire about an order with an Order ID or Phone number, consult the "Matched Order Details" in the context and provide their live status, delivery info, and courier tracking details.
3. **Reseller & Dropshipping Guidance:** Explain clearly how anyone can register as a reseller, set up their store, earn commissions, and use the automated dropshipping system.
4. **Product Recommendations & Clickable Links:** Whenever you suggest, recommend, or present products to a user, ALWAYS include the product markdown link using the exact relative path from context: [Product Name](/product/slug). The system will automatically render our interactive Product Card (V1) for each product mentioned so the user can see its photo, price, and add it directly to cart!
5. Always provide concise, accurate, and helpful answers without fabricating products or order details not present in the system context.
`;

// Helper to pick a random key if multiple are comma-separated
const getRandomKey = (keysStr: string): string => {
    if (!keysStr) return "";
    const keys = keysStr.split(',').map(key => key.trim()).filter(key => key.length > 0);
    if (keys.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
};

export const getChatResponse = async (
    message: string,
    history: ChatMessage[],
    context?: string,
    apiKey?: string
): Promise<string> => {
    if (!apiKey) {
        console.error("❌ Google Gemini API Key is missing.");
        return "I'm sorry, I can't connect to the AI assistant right now. (Server Error: Missing Gemini API Key in configuration).";
    }

    const selectedKey = getRandomKey(apiKey);
    if (!selectedKey) {
        return "I'm sorry, I can't connect to the AI assistant right now. (Server Error: Invalid Gemini API Key).";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: selectedKey });
        const candidateModels = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-flash-latest"];

        // Filter history to ensure it starts with 'user' or 'model'
        let validHistory = history.filter(msg => msg.role === 'user' || msg.role === 'model');

        // Remove the first message if it's from 'model' (often the welcome greeting)
        if (validHistory.length > 0 && validHistory[0].role === 'model') {
            validHistory = validHistory.slice(1);
        }

        // Convert to SDK format
        const contents = validHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.parts }]
        }));

        // Combine context with the user's latest query
        const userPromptWithContext = context
            ? `${context}\n\nUser Question: ${message}`
            : message;

        // Add the current new message
        contents.push({
            role: 'user',
            parts: [{ text: userPromptWithContext }]
        });

        let lastError: any = null;

        for (const model of candidateModels) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents,
                    config: {
                        systemInstruction: SYSTEM_INSTRUCTION,
                    }
                });

                if (response.text) {
                    return response.text;
                }
            } catch (err: any) {
                lastError = err;
                console.warn(`⚠️ Model ${model} failed, trying fallback:`, err.message || err);
                // If temporary capacity issue or high demand, proceed to fallback model
                continue;
            }
        }

        throw lastError || new Error("All Gemini model fallbacks exhausted");

    } catch (error: any) {
        console.error("❌ Google Gemini SDK Error:", error);
        if (error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('UNAVAILABLE')) {
            return "সার্ভারে সাময়িক অতিরিক্ত ট্রাফিকের কারণে সংযোগ পেতে কিছুটা বিলম্ব হচ্ছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।";
        }
        return `I'm having trouble thinking right now. Please try again in a moment.`;
    }
};
