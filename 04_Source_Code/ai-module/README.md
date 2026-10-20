# AI Requirement Generator Module Specification

## 1. Overview
The AI Requirement Generator analyzes high-level event specifications:
- Event Type (Wedding, College Fest, Corporate Conference, Birthday, Seminar)
- Guest Count (Scale factor for catering, seating, water, logistics)
- Budget Ceiling (INR ₹, dictates price tier and allocation percentages)
- Venue & Location (Audiovisual and spatial requirements)
- Event Description (Specific thematic priorities)

---

## 2. Current Prototype Implementation
In Prototype v1.0, the generator is implemented as an asynchronous deterministic rule-based engine in `04_Source_Code/frontend/js/ai-generator.js`.

### Algorithmic Rules:
1. **Catering Allocation:** 28%–40% of total budget based on event formality. Per-guest cost suggested based on headcount.
2. **Seating & Tables:** Chairs calculated with a 10% safety buffer (`guests * 1.1`), banquet tables grouped by 8 (`ceil(guests / 8)`).
3. **Audiovisual:** Scaled dynamically (Concert line-array for college fests; DJ stage for weddings; PA speaker systems for conferences).
4. **Decor & Ambience:** 10%–22% allocated with custom thematic descriptors.
5. **Photography:** Single vs. multi-camera crew based on guest density and budget tier.
6. **Logistics:** Water bottles calculated at 2 units/guest; registration kits tailored for conferences.

---

## 3. Future Gemini 2.5 API Integration Roadmap
When transitioning from the prototype to the final production release, the method `generateRequirements(eventDetails)` can directly call Google Gemini API via `@google/genai`:

```typescript
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI();

export async function generateEventRequirementsGemini(eventDetails) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze event: ${JSON.stringify(eventDetails)}. Formulate categorized requirements with quantity, estimated cost in INR, priority (High/Medium/Low), and operational notes. Total estimated cost must remain within 85-95% of total budget.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            item: { type: Type.STRING },
            quantity: { type: Type.INTEGER },
            estimated_cost: { type: Type.NUMBER },
            priority: { type: Type.STRING },
            notes: { type: Type.STRING }
          },
          required: ['category', 'item', 'quantity', 'estimated_cost', 'priority']
        }
      }
    }
  });

  return JSON.parse(response.text);
}
```
Because the prototype's `AIRequirementGenerator.generateRequirements` returns a Promise resolving to the exact schema above, the replacement is completely seamless.
