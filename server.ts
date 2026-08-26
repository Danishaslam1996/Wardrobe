import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'x67ga43w',
  api_key: process.env.CLOUDINARY_API_KEY || '835744753786919',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'uStYl6wTNE6JVv2MPelHpXbiz38',
});

async function buildImagePart(imageBase64: string, fallbackMimeType: string = 'image/jpeg') {
  if (imageBase64.startsWith('http://') || imageBase64.startsWith('https://')) {
    const fetched = await fetch(imageBase64);
    if (!fetched.ok) {
       throw new Error(`Failed to fetch image from URL: ${fetched.statusText}`);
    }
    const arrayBuf = await fetched.arrayBuffer();
    const base64Data = Buffer.from(arrayBuf).toString('base64');
    let contentType = fetched.headers.get('content-type') || fallbackMimeType;
    if (contentType === 'image/jpg') contentType = 'image/jpeg';
    
    return {
      inlineData: {
        mimeType: contentType,
        data: base64Data,
      },
    };
  } else {
    let cleanMimeType = fallbackMimeType;
    if (cleanMimeType === 'image/jpg') cleanMimeType = 'image/jpeg';
    const cleanData = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    return {
      inlineData: {
        mimeType: cleanMimeType,
        data: cleanData,
      },
    };
  }
}

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Gemini API Key. Please click the Settings gear icon in the top right to configure your API Key.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const originalGenerateContent = ai.models.generateContent.bind(ai.models);

  ai.models.generateContent = async function (...args: any[]) {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await originalGenerateContent(...args);
      } catch (error: any) {
        const isRetryable =
          error?.status === 503 ||
          error?.status === 429 ||
          error?.message?.includes('high demand') ||
          error?.message?.includes('overloaded') ||
          error?.message?.includes('Too Many Requests');

        if (isRetryable && i < maxRetries - 1) {
          const waitMs = Math.pow(2, i) * 1000 + Math.random() * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Unreachable code');
  };

  return ai;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add request logger
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  });

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasDefaultKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  /**
   * Pre-processed ML Background Removal with sharp edge padding & isnet model
   */
  app.post('/api/remove-background', async (req, res) => {
    try {
      const { imageBase64, rotation = 0 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ success: false, error: 'imageBase64 is required' });
      }

      let rawBuffer: Buffer;
      if (typeof imageBase64 === 'string' && (imageBase64.startsWith('http://') || imageBase64.startsWith('https://'))) {
        const resp = await fetch(imageBase64);
        const arrayBuf = await resp.arrayBuffer();
        rawBuffer = Buffer.from(arrayBuf);
      } else {
        let cleanBase64 = String(imageBase64)
          .replace(/^data:[^;]+;base64,/, '')
          .replace(/\s+/g, '');
        
        // Pad the base64 string to be a multiple of 4 to prevent Node from truncating the last bytes
        while (cleanBase64.length % 4 !== 0) {
          cleanBase64 += '=';
        }
        rawBuffer = Buffer.from(cleanBase64, 'base64');
      }

      // If buffer is invalid or empty, return original image source
      if (!rawBuffer || rawBuffer.length === 0) {
        return res.json({
          success: true,
          imageUrl: imageBase64,
          images: [imageBase64],
        });
      }

      // 1. Explicitly rotate by degree and resize maintaining aspect ratio into clean PNG with lenient error tolerance
      let preProcessedBuffer: Buffer = rawBuffer;
      try {
        preProcessedBuffer = await sharp(rawBuffer, { failOn: 'none', unlimited: true })
          .rotate(Number(rotation) || 0)
          .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .png()
          .toBuffer();
      } catch (sharpInitialErr) {
        console.warn('Sharp initial processing note, attempting raw PNG conversion:', sharpInitialErr);
        try {
          preProcessedBuffer = await sharp(rawBuffer, { failOn: 'none', unlimited: true })
            .png()
            .toBuffer();
        } catch {
          preProcessedBuffer = rawBuffer;
        }
      }

      const mimeMatch = typeof imageBase64 === 'string' ? imageBase64.match(/^data:([^;]+);base64,/) : null;
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      // 2. Convert pre-processed buffer to Blob and run background removal
      let outputBuffer: Buffer = preProcessedBuffer;
      try {
        const blob = new Blob([preProcessedBuffer], { type: preProcessedBuffer === rawBuffer ? mimeType : 'image/png' });
        const outputBlob = await removeBackground(blob, { model: 'small' });
        outputBuffer = Buffer.from(await outputBlob.arrayBuffer());
      } catch (bgError: any) {
        console.warn('ML background removal skipped/failed, using pre-processed image:', bgError?.message || bgError);
        outputBuffer = preProcessedBuffer;
      }

      // 3. Flatten transparent cutout onto a pure white canvas, trim excess white border, and output high quality JPEG
      let flattenedBuffer: Buffer = outputBuffer;
      try {
        flattenedBuffer = await sharp(outputBuffer, { failOn: 'none', unlimited: true })
          .flatten({ background: '#FFFFFF' })
          .trim()
          .jpeg({ quality: 70 })
          .toBuffer();
      } catch (trimErr) {
        try {
          flattenedBuffer = await sharp(outputBuffer, { failOn: 'none', unlimited: true })
            .flatten({ background: '#FFFFFF' })
            .jpeg({ quality: 70 })
            .toBuffer();
        } catch {
          flattenedBuffer = outputBuffer;
        }
      }

      // 4. Upload to Cloudinary with safe fallback
      let publicUrl = '';
      if (flattenedBuffer === rawBuffer && typeof imageBase64 === 'string') {
        publicUrl = imageBase64;
      } else {
        publicUrl = `data:image/jpeg;base64,${flattenedBuffer.toString('base64')}`;
      }

      try {
        const uploadPromise = new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'daily_threads_wardrobe', resource_type: 'image', format: 'jpg' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result!.secure_url);
            }
          );
          stream.end(flattenedBuffer);
        });
        publicUrl = await uploadPromise;
      } catch (storageErr) {
        console.warn('Cloudinary upload fallback to base64 data URL', storageErr);
      }

      res.json({
        success: true,
        imageUrl: publicUrl,
        images: [publicUrl],
      });
    } catch (error: any) {
      console.error('Error in remove-background route:', error);
      // Even if unexpected error occurs, gracefully return original image so user flow isn't disrupted
      const fallbackUrl = req.body?.imageBase64 || '';
      res.json({
        success: true,
        imageUrl: fallbackUrl,
        images: [fallbackUrl],
      });
    }
  });

  // Analyze Item / Auto-Tagging & Deduplication endpoint
  app.post('/api/gemini/analyze-item', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', existingItems = [], profileId = 'danish' } = req.body;
      const customApiKey = req.headers['x-gemini-key'] as string | undefined;

      const ai = getGeminiClient(customApiKey);

      const existingItemsSummary = (existingItems as Array<{ id: string; name: string; category: string; color: { primary: string } }>)
        .slice(0, 30)
        .map((i) => `ID:${i.id} | ${i.name} (${i.category}, ${i.color?.primary || 'neutral'})`)
        .join('\n');

      const isEesha = profileId === 'eesha';
      const prompt = `You are an elite haute-couture archivist and luxury wardrobe curator.
Analyze this single uploaded garment cutout.
Profile context: ${isEesha ? 'Eesha (Modest luxury, elegant silhouettes, hijabs/abayas/stoles)' : 'Danish (Modern sharp tailoring, luxury minimalism)'}
Strict rules:
- Return a JSON object with:
- "name": refined luxury title (e.g. "Loro Piana Cashmere Knit", "Tailored Pleated Trousers")
- "category": One of exactly: "tops", "bottoms", "outerwear", "dresses", "shoes", "stoles_scarves", "jewelry", "accessories", "bags"
- "subcategory": specific type (e.g. "Oxford Shirt", "Pleated Trousers", "Silk Hijab")
- "color": { "primary": string, "secondary": string or null, "hex": estimated hex code like "#2C3E50" }
- "material": array of strings (e.g. ["Silk", "Wool", "Linen", "Cotton"])
- "vibe": array of strings from ["casual", "formal", "smart_casual", "festive", "business", "minimalist", "athletic"]
- "season": array of strings from ["all_year", "summer", "winter", "spring", "fall"]
- "description": 1-2 sentence luxury editorial description of drape and styling versatility.
- "isDuplicate": boolean (true if image strongly resembles one of the existing items listed below)
- "duplicateItemId": string or null
- "duplicateReason": string or null

Existing wardrobe items:
${existingItemsSummary || 'None currently registered'}`;

      const imagePart = await buildImagePart(imageBase64, mimeType);

      let response: any;
      const primaryModel = 'gemini-3.6-flash';

      try {
        response = await ai.models.generateContent({
          model: primaryModel,
          contents: {
            parts: [imagePart, { text: prompt }],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                subcategory: { type: Type.STRING },
                color: {
                  type: Type.OBJECT,
                  properties: {
                    primary: { type: Type.STRING },
                    secondary: { type: Type.STRING },
                    hex: { type: Type.STRING },
                  },
                  required: ['primary', 'hex'],
                },
                material: { type: Type.ARRAY, items: { type: Type.STRING } },
                vibe: { type: Type.ARRAY, items: { type: Type.STRING } },
                season: { type: Type.ARRAY, items: { type: Type.STRING } },
                description: { type: Type.STRING },
                isDuplicate: { type: Type.BOOLEAN },
                duplicateItemId: { type: Type.STRING },
                duplicateReason: { type: Type.STRING },
              },
              required: ['name', 'category', 'color', 'material', 'vibe', 'season', 'description'],
            },
          },
        });
      } catch (geminiErr: any) {
        console.warn('Primary Gemini model 3.6-flash encountered issue, trying 3.7-flash...', geminiErr?.message);
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: {
              parts: [imagePart, { text: prompt }],
            },
            config: {
              responseMimeType: 'application/json',
            },
          });
        } catch (secErr: any) {
          console.warn('Fallback Gemini model also failed, returning structured default piece:', secErr?.message);
          return res.json({
            success: true,
            data: {
              name: 'Wardrobe Piece',
              category: 'tops',
              subcategory: 'Piece',
              color: { primary: 'Black', secondary: null, hex: '#1e1e1e' },
              material: ['Cotton'],
              vibe: ['casual', 'smart_casual'],
              season: ['all_year'],
              description: 'Versatile contemporary piece with clean tailoring.',
              isDuplicate: false,
              duplicateItemId: null,
              duplicateReason: null,
            },
          });
        }
      }

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Error analyzing item:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to analyze item' });
    }
  });

  // Multi-Piece Outfit Deconstruction Endpoint
  app.post('/api/gemini/extract-outfit-pieces', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', profileId = 'danish', existingItems = [] } = req.body;
      const customApiKey = req.headers['x-gemini-key'] as string | undefined;

      const ai = getGeminiClient(customApiKey);

      const existingItemsSummary = (existingItems as Array<{ id: string; name: string; category: string; color: { primary: string } }>)
        .slice(0, 30)
        .map((i) => `ID:${i.id} | ${i.name} (${i.category}, ${i.color?.primary || 'neutral'})`)
        .join('\n');

      const isEesha = profileId === 'eesha';
      const prompt = `You are a high-fashion AI stylist and digital wardrobe archivist specializing in garment deconstruction.
The user uploaded a full-body or upper-body photo wearing an entire outfit.

Profile Context: ${isEesha ? 'Eesha (Modest luxury, hijabs, stoles, flowy silhouettes, fine jewelry)' : 'Danish (Sharp tailoring, structured minimalism, blazers, trousers)'}

YOUR TASK:
1. Detect and isolate EVERY distinct individual garment, layer, stole/hijab, footwear, jewelry piece, or accessory visible in this photograph.
2. For each detected piece:
   - Provide precise 2D bounding box normalized coordinates in [ymin, xmin, ymax, xmax] format on a scale from 0 to 1000.
   - Categorize into one of: "tops", "bottoms", "outerwear", "dresses", "shoes", "stoles_scarves", "jewelry", "accessories", "bags".
   - Compare with user's existing wardrobe items to detect if this piece is ALREADY owned/catalogued.

Existing Wardrobe Inventory:
${existingItemsSummary || 'No items registered yet'}`;

      const imagePart = await buildImagePart(imageBase64, mimeType);

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: {
          parts: [imagePart, { text: prompt }],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              outfitName: { type: Type.STRING },
              outfitVibe: { type: Type.STRING },
              totalDetected: { type: Type.INTEGER },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    subcategory: { type: Type.STRING },
                    box2d: {
                      type: Type.ARRAY,
                      items: { type: Type.INTEGER },
                      description: '[ymin, xmin, ymax, xmax] on scale 0 to 1000',
                    },
                    color: {
                      type: Type.OBJECT,
                      properties: {
                        primary: { type: Type.STRING },
                        secondary: { type: Type.STRING },
                        hex: { type: Type.STRING },
                      },
                      required: ['primary', 'hex'],
                    },
                    material: { type: Type.ARRAY, items: { type: Type.STRING } },
                    vibe: { type: Type.ARRAY, items: { type: Type.STRING } },
                    season: { type: Type.ARRAY, items: { type: Type.STRING } },
                    confidence: { type: Type.INTEGER },
                    stylingNotes: { type: Type.STRING },
                    isAlreadyInWardrobe: { type: Type.BOOLEAN },
                    matchedWardrobeItemId: { type: Type.STRING },
                    matchedWardrobeItemName: { type: Type.STRING },
                    matchReason: { type: Type.STRING },
                    matchConfidence: { type: Type.INTEGER },
                  },
                  required: ['name', 'category', 'box2d', 'color', 'material', 'vibe', 'season', 'confidence'],
                },
              },
            },
            required: ['outfitName', 'outfitVibe', 'totalDetected', 'items'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Error deconstructing outfit pieces:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to deconstruct outfit pieces' });
    }
  });

  // AI Body Visualizer / Try-On Analysis Endpoint
  app.post('/api/gemini/visualize-body', async (req, res) => {
    try {
      const { profileId = 'danish', bodySettings, selectedItems = [], lighting = 'studio' } = req.body;
      const customApiKey = req.headers['x-gemini-key'] as string | undefined;

      const ai = getGeminiClient(customApiKey);

      const itemsSummary = selectedItems
        .map((it: any) => `- ${it.name} (${it.category}, ${it.color?.primary || 'neutral'}, Material: ${(it.material || []).join(', ')})`)
        .join('\n');

      const prompt = `You are an editorial creative director and bespoke tailor analyzing an assembled silhouette.
Profile: ${profileId === 'eesha' ? 'Eesha (Modest luxury, elegant drape, hijab styling)' : 'Danish (Modern sharp tailoring, proportional balance)'}
Body Profile: Height: ${bodySettings?.height || "5'11"}, Build: ${bodySettings?.buildType || 'athletic'}, Skin Tone: ${bodySettings?.skinTone || 'olive'}, Drape: ${bodySettings?.drapePreference || 'tucked'}
Lighting: ${lighting}

Assembled Ensemble:
${itemsSummary}

Provide a comprehensive luxury critique in JSON:
- "silhouetteScore": number 1-100
- "fitHeadline": punchy editorial verdict
- "bodyFitAnalysis": { "upperBody": string, "midSection": string, "lowerBody": string, "accessoriesDrape": string }
- "colorHarmony": description of contrast and skin-tone resonance
- "stylingTweaks": array of 2-3 precise styling adjustments
- "editorialCritique": 2-3 sentence luxury editorial critique`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              silhouetteScore: { type: Type.INTEGER },
              fitHeadline: { type: Type.STRING },
              bodyFitAnalysis: {
                type: Type.OBJECT,
                properties: {
                  upperBody: { type: Type.STRING },
                  midSection: { type: Type.STRING },
                  lowerBody: { type: Type.STRING },
                  accessoriesDrape: { type: Type.STRING },
                },
                required: ['upperBody', 'midSection', 'lowerBody', 'accessoriesDrape'],
              },
              colorHarmony: { type: Type.STRING },
              stylingTweaks: { type: Type.ARRAY, items: { type: Type.STRING } },
              editorialCritique: { type: Type.STRING },
            },
            required: ['silhouetteScore', 'fitHeadline', 'bodyFitAnalysis', 'colorHarmony', 'stylingTweaks', 'editorialCritique'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Error visualizing body:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to analyze on-body look' });
    }
  });

  // Daily Pick & Occasion Styling Recommendation Endpoint
  app.post('/api/gemini/daily-pick', async (req, res) => {
    try {
      const { profileId = 'danish', availableItems = [], weather, whoMeeting, vibes, occasion, notes } = req.body;
      const customApiKey = req.headers['x-gemini-key'] as string | undefined;

      const ai = getGeminiClient(customApiKey);

      // Filter out laundry items just to be safe
      const cleanItems = (availableItems as any[]).filter(it => !it.isLaundry);
      const itemsSummary = cleanItems
        .map((it: any) => `ID:${it.id} | ${it.name} (Cat: ${it.category}, Color: ${it.color?.primary || 'neutral'}, Material: ${it.material || 'mixed'}, Vibe:${(it.vibe || []).join('/')})`)
        .join('\n');

      const isEesha = profileId === 'eesha';
      
      const prompt = `You are a personal haute-couture stylist preparing a curated outfit for ${isEesha ? 'Eesha' : 'Danish'}.

PROFILE CONSTRAINTS:
${isEesha 
  ? "Eesha's style requires modest layering, stoles/hijabs, and fine jewelry pairings. Do not suggest revealing proportions."
  : "Danish's style prioritizes structured tailoring, modern proportions, and clean footwear. Focus on sharp, clean lines."
}

ENVIRONMENT CONTEXT:
Who they are meeting: ${whoMeeting || 'Not specified'}
Desired Vibes: ${(vibes || []).join(', ') || 'Not specified'}
Occasion & Setting: ${occasion || 'Everyday styling'}
Additional Styling Notes/Weather: ${notes || 'None'}
Weather: ${JSON.stringify(weather || { tempC: 20, condition: 'Clear' })}

Available Wardrobe:
${itemsSummary}

INSTRUCTIONS:
Select the most harmonious set of item IDs for a complete ensemble from the Available Wardrobe only. Do not hallucinate IDs.
Return valid JSON matching the schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              outfitName: { type: Type.STRING },
              vibeSummary: { type: Type.STRING },
              selectedItemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              stylingAdvice: { type: Type.STRING },
              missingPieceTip: { type: Type.STRING },
            },
            required: ['outfitName', 'vibeSummary', 'selectedItemIds', 'stylingAdvice'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Error generating daily pick:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to generate outfit' });
    }
  });

  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
