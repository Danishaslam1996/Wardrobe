const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const oldGeminiRoute = `  app.post('/api/gemini/daily-pick', async (req, res) => {
    try {
      const { profileId = 'danish', availableItems = [], weather, context } = req.body;
      const customApiKey = req.headers['x-gemini-key'] as string | undefined;

      const ai = getGeminiClient(customApiKey);

      const itemsSummary = (availableItems as any[])
        .map((it: any) => \`ID:\${it.id} | \${it.name} (\${it.category}, \${it.color?.primary || 'neutral'}, Vibe:\${(it.vibe || []).join('/')}, Season:\${(it.season || []).join('/')})\`)
        .join('\\n');

      const isEesha = profileId === 'eesha';
      const prompt = \`You are a personal haute-couture stylist preparing today's daily outfit for \${isEesha ? 'Eesha' : 'Danish'}.
Weather: \${JSON.stringify(weather || { tempC: 20, condition: 'Clear' })}
Context: \${JSON.stringify(context || { occasion: 'Everyday Styling', when: 'Today' })}

Available Wardrobe:
\${itemsSummary}

Select the most harmonious set of item IDs for a complete ensemble. Provide a name, vibe, editorial rationale, and weather adaptation notes.\`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              vibe: { type: Type.STRING },
              selectedItemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              editorialNote: { type: Type.STRING },
              weatherAdaptation: { type: Type.STRING },
            },
            required: ['name', 'vibe', 'selectedItemIds', 'editorialNote', 'weatherAdaptation'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, recommendation: parsed });
    } catch (error: any) {
      console.error('Error generating daily pick:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to generate daily pick' });
    }
  });`;

const newGeminiRoute = `  app.post('/api/gemini/daily-pick', async (req, res) => {
    try {
      const { profileId = 'danish', availableItems = [], weather, context } = req.body;
      const customApiKey = req.headers['x-gemini-key'] as string | undefined;

      const ai = getGeminiClient(customApiKey);

      // Filter out laundry items just to be safe
      const cleanItems = (availableItems as any[]).filter(it => !it.isLaundry);
      const itemsSummary = cleanItems
        .map((it: any) => \`ID:\${it.id} | \${it.name} (Cat: \${it.category}, Color: \${it.color?.primary || 'neutral'}, Material: \${it.material || 'mixed'}, Vibe:\${(it.vibe || []).join('/')})\`)
        .join('\\n');

      const isEesha = profileId === 'eesha';
      
      const prompt = \`You are a personal haute-couture stylist preparing a curated outfit for \${isEesha ? 'Eesha' : 'Danish'}.

PROFILE CONSTRAINTS:
\${isEesha 
  ? "Eesha's style requires modest layering, stoles/hijabs, and fine jewelry pairings. Do not suggest revealing proportions."
  : "Danish's style prioritizes structured tailoring, modern proportions, and clean footwear. Focus on sharp, clean lines."
}

ENVIRONMENT CONTEXT:
Who they are meeting: \${context.whoMeeting || 'Not specified'}
Desired Vibes: \${(context.vibes || []).join(', ') || 'Not specified'}
Occasion & Setting: \${context.occasion || 'Everyday styling'}
Additional Styling Notes/Weather: \${context.notes || 'None'}
Weather: \${JSON.stringify(weather || { tempC: 20, condition: 'Clear' })}

Available Wardrobe:
\${itemsSummary}

INSTRUCTIONS:
Select the most harmonious set of item IDs for a complete ensemble from the Available Wardrobe only. Do not hallucinate IDs.
Return valid JSON matching the schema.\`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
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
      res.json({ success: true, recommendation: parsed });
    } catch (error: any) {
      console.error('Error generating daily pick:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to generate outfit' });
    }
  });`;

serverCode = serverCode.replace(oldGeminiRoute, newGeminiRoute);
fs.writeFileSync('server.ts', serverCode);
