import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getCachedSettings } from '@/lib/data-fetching';
import { retrieveRelevantContext } from '@/services/ragService';
import { getChatResponse } from '@/services/geminiService';
import { auth } from '@/auth';
import Product from '@/models/Product';

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Fetch global AI configuration
    const settings = await getCachedSettings();
    const aiConfig = settings?.aiConfig || {};
    
    const apiKey = aiConfig.geminiApiKey;

    if (!apiKey) {
      console.error('Gemini API Key is missing');
      return NextResponse.json({ error: 'AI Service Unavailable. Gemini API Key is not configured.' }, { status: 503 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const validatedMessages = messages
      .filter((msg: any) => {
        return (
          msg &&
          typeof msg === 'object' &&
          typeof msg.content === 'string' &&
          msg.content.trim().length > 0 &&
          (msg.role === 'user' || msg.role === 'assistant')
        );
      })
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content.substring(0, MAX_CONTENT_LENGTH)
      }));

    if (validatedMessages.length === 0) {
      return NextResponse.json({ error: 'Valid messages are required' }, { status: 400 });
    }

    if (validatedMessages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: `Too many messages. Max allowed: ${MAX_MESSAGES}` }, { status: 422 });
    }

    // Extract the latest message and history
    const latestMessageObj = validatedMessages[validatedMessages.length - 1];
    if (latestMessageObj.role !== 'user') {
      return NextResponse.json({ error: 'Latest message must be from user' }, { status: 400 });
    }
    const latestMessage = latestMessageObj.content;
    const history = validatedMessages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: msg.content
    }));

    // Retrieve real-time relevant database records via vector/keyword search
    const { contextString, matchedProducts } = await retrieveRelevantContext(latestMessage, (session?.user as any)?.id, apiKey);
    console.log("RAG Context retrieved, length:", contextString ? contextString.length : 0);

    const response = await getChatResponse(latestMessage, history, contextString, apiKey);

    // Extract product slugs/IDs from LLM response
    const slugMatches = Array.from(response.matchAll(/\/product\/([a-zA-Z0-9_-]+)/g)).map(m => m[1]);
    let suggestedProducts: any[] = [];

    if (slugMatches.length > 0) {
      const uniqueSlugs = Array.from(new Set(slugMatches));
      const objectIds = uniqueSlugs.filter(s => mongoose.Types.ObjectId.isValid(s));

      const found = await Product.find({
        $or: [{ slug: { $in: uniqueSlugs } }, { _id: { $in: objectIds } }],
        isPublished: true,
      })
      .select('_id name slug price salePrice images isFeatured isNewArrival stock sku categories ratings numReviews variants')
      .populate('categories', 'name slug')
      .limit(10)
      .lean();

      if (found && found.length > 0) {
        suggestedProducts = JSON.parse(JSON.stringify(found));
      }
    }

    // Fallback: If no direct link was in the text but user asked about products and RAG found items
    if (suggestedProducts.length === 0 && matchedProducts && matchedProducts.length > 0) {
      const isProductInquiry = /(product|buy|price|cost|shop|collection|shirt|pant|dress|panjabi|watch|shoe|shari|শার্ট|প্যান্ট|পাঞ্জাবি|শাড়ি|প্রোডাক্ট|পণ্য|দাম|কিনব|অর্ডার|দেখাও)/i.test(latestMessage);
      if (isProductInquiry) {
        suggestedProducts = JSON.parse(JSON.stringify(matchedProducts.slice(0, 10)));
      }
    }

    return NextResponse.json({ message: response, products: suggestedProducts });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to connect to AI' }, { status: 500 });
  }
}
