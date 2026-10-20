import { ai } from '../config/gemini.ts';
import { Type } from '@google/genai';

export interface EventAnalysisInput {
  name: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  budget: number;
  location?: string;
  duration?: string;
  description?: string;
  special_requirements?: string;
  expected_audience?: string;
  food_requirements?: string;
  decoration_requirements?: string;
  entertainment_requirements?: string;
  transportation_requirements?: string;
  other_notes?: string;
  regeneration_scope?: 'all' | 'requirements' | 'tasks' | 'budget';
}

export class GeminiService {
  /**
   * Resolves and sanitizes the Gemini model identifier from environment or defaults.
   */
  static getActiveModel(): string {
    let modelName = (process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim();

    if (modelName.includes('/models/')) {
      modelName = modelName.split('/models/').pop()?.split(':')[0] || modelName;
    }
    
    if (modelName.startsWith('models/')) {
      modelName = modelName.substring(7);
    }

    if (modelName.startsWith('AIzaSy')) {
      modelName = 'gemini-3.8-flash';
    }

    const deprecatedModels = [
      'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 
      'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.0-flash-thinking',
      'gemini-1.5-flash-latest'
    ];
    
    if (deprecatedModels.some(m => modelName.includes(m))) {
      modelName = 'gemini-3.8-flash';
    }

    return modelName;
  }

  /**
   * Performs deep event analysis and generates structured planning data
   * using the recommended Gemini 3.8 Flash model.
   */
  static async analyzeEvent(input: EventAnalysisInput): Promise<any> {
    // Use consolidated model resolution
    const modelName = this.getActiveModel();

    const apiKey = process.env.GEMINI_API_KEY;

    // Check if real Gemini API key is configured
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 10) {
      console.warn('GEMINI_API_KEY is not configured or invalid. Falling back to deterministic planner.');
      return this.generateFallbackPlan(input);
    }

    const eventDate = input.event_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const guests = Number(input.guest_count) || 100;
    const budget = Number(input.budget) || 100000;

    const systemInstruction = `
You are a senior professional event planning strategist and hospitality architect.
Your goal is to generate a complete, production-grade event plan that adheres to a HARD budget constraint.

CRITICAL INSTRUCTIONS:
1. BUDGET IS A HARD CONSTRAINT: The sanctioned budget of ₹${budget} is absolute. 
   - Sum of (quantity × unit_cost) MUST BE <= budget.
   - If the requested guest count of ${guests} is impossible for ₹${budget}, you MUST scale down the service level (e.g., snacks instead of dinner) or flag it clearly while still providing a plan that FITS.
   - Never reduce market prices artificially to fit. Instead, change the item quality or quantity.
2. HOME VENUE OPTIMIZATION: If the location is "Home", "House", or similar:
   - EXCLUDE: Venue rental, Hall booking, Security staff, Professional event coordination fees.
   - EXCLUDE: Large stage setups, elaborate AV, or logistics unless explicitly requested.
   - ASSUME: User has access to basic power, space, and simple furniture unless they are renting it.
   - PRIORITIZE: Food, essential seating, and minimal decor.
3. DETAILED ITEMIZATION:
   - No generic "Catering". Use "Standard Buffet for ${guests} guests".
   - Include specific unit types: "plates", "units", "sets", "hours".
   - Priority: High (Essential), Medium (Recommended), Low (Optional).
4. VALIDATION: Every requirement must have a quantity, unit, and unit_cost.
5. REALISM: If budget is very tight (e.g. <₹100/person), focus on the bare minimum essentials only.
`;

    const prompt = `
Plan this event:
- Name: ${input.name}
- Type: ${input.event_type}
- Date: ${eventDate}
- Guests: ${guests}
- Budget: ₹${budget}
- Location: ${input.location || 'Home'}
- Special Requirements: ${input.special_requirements || 'None'}

PLANNING CONTEXT:
${input.other_notes || 'Standard wedding planning.'}

IMPORTANT:
- Is this a Home wedding? ${input.location?.toLowerCase().includes('home') ? 'YES' : 'NO'}
- If Home: Do NOT include venue rental. Focus on catering and essentials.
- Total cost MUST NOT exceed ₹${budget}.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        event_summary: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING, description: "Professional summary of the planning strategy" },
            budget_analysis: { type: Type.STRING, description: "Detailed explanation of budget allocation and constraints" },
            is_budget_realistic: { type: Type.BOOLEAN },
            planning_complexity: { type: Type.STRING, description: "High | Medium | Low" },
            assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            follow_up_questions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["overview", "budget_analysis", "is_budget_realistic", "planning_complexity"]
        },
        requirements: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Venue, Food, Decoration, Furniture, AV, Staff, Logistics, Other" },
              item: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              estimated_unit_cost: { type: Type.NUMBER },
              priority: { type: Type.STRING, description: "High, Medium, Low" },
              status: { type: Type.STRING, description: "Pending" },
              estimate_source: { type: Type.STRING, description: "Assumed | Supplier-Verified" },
              dependencies: { type: Type.STRING },
              notes: { type: Type.STRING }
            },
            required: ["category", "item", "quantity", "unit", "estimated_unit_cost", "priority", "status", "estimate_source"]
          }
        },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              priority: { type: Type.STRING },
              suggested_due_date: { type: Type.STRING },
              notes: { type: Type.STRING }
            },
            required: ["title", "category", "priority"]
          }
        }
      },
      required: ["event_summary", "requirements", "tasks"]
    };

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1
        }
      });

      const fullOutput = response.text || '';
      if (!fullOutput) throw new Error('AI returned an empty response.');

      return this.processAndValidateResult(JSON.parse(fullOutput), input);
    } catch (err: any) {
      console.error(`Gemini API Error (${modelName}):`, err);
      // Fallback logic
      if (err?.message?.includes('not found') || err?.message?.includes('unsupported')) {
        try {
          const retryResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: responseSchema,
              temperature: 0.1
            }
          });
          const retryText = retryResponse.text || '';
          if (retryText) {
            return this.processAndValidateResult(JSON.parse(retryText), input);
          }
        } catch (retryErr) {
           console.error('Retry failed:', retryErr);
        }
      }
      return this.generateFallbackPlan(input);
    }
  }

  private static processAndValidateResult(data: any, input: EventAnalysisInput): any {
    const totalBudget = Number(input.budget) || 0;
    
    // 1. Force consistent calculations and cleanup
    if (Array.isArray(data.requirements)) {
      data.requirements = data.requirements.map((r: any) => {
        const qty = Math.max(0, Number(r.quantity) || 0);
        const unitCost = Math.max(0, Number(r.estimated_unit_cost) || 0);
        return {
          ...r,
          quantity: qty,
          estimated_unit_cost: unitCost,
          estimated_cost: qty * unitCost,
          status: 'Pending',
          priority: ['High', 'Medium', 'Low'].includes(r.priority) ? r.priority : 'Medium'
        };
      });
    } else {
      data.requirements = [];
    }

    // 2. HARD BUDGET ENFORCEMENT: If over budget, prune or scale
    let estimatedTotal = data.requirements.reduce((sum: number, r: any) => sum + r.estimated_cost, 0);
    
    if (estimatedTotal > totalBudget && totalBudget > 0) {
      console.log(`HEMS: Plan exceeds budget (₹${estimatedTotal} > ₹${totalBudget}). Pruning...`);
      
      // Sort by priority (Low first) to prune
      const priorityOrder: Record<string, number> = { 'Low': 0, 'Medium': 1, 'High': 2 };
      const sortedReqs = [...data.requirements].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      
      const adjustedReqs: any[] = [];
      let currentTotal = 0;
      
      // Keep only what fits, starting with High priority
      const highPri = sortedReqs.filter(r => r.priority === 'High');
      const medPri = sortedReqs.filter(r => r.priority === 'Medium');
      const lowPri = sortedReqs.filter(r => r.priority === 'Low');

      const prioritizedList = [...highPri, ...medPri, ...lowPri];
      
      for (const req of prioritizedList) {
        if (currentTotal + req.estimated_cost <= totalBudget) {
          adjustedReqs.push(req);
          currentTotal += req.estimated_cost;
        } else if (req.priority === 'High' && currentTotal < totalBudget) {
          // If even a high priority item doesn't fit fully, try to scale its quantity if possible
          const remaining = totalBudget - currentTotal;
          if (remaining > 0 && req.estimated_unit_cost > 0) {
            const possibleQty = Math.floor(remaining / req.estimated_unit_cost);
            if (possibleQty > 0) {
              req.quantity = possibleQty;
              req.estimated_cost = possibleQty * req.estimated_unit_cost;
              req.notes = (req.notes || '') + ' [Scaled down to fit budget]';
              adjustedReqs.push(req);
              currentTotal += req.estimated_cost;
            }
          }
        }
      }
      
      data.requirements = adjustedReqs;
      estimatedTotal = currentTotal;
      data.event_summary.budget_analysis += ` [SYSTEM ADJUSTMENT: Plan was trimmed from original proposal to fit ₹${totalBudget.toLocaleString()} limit.]`;
    }
    
    data.budget_summary = {
      total_budget: totalBudget,
      estimated_total_cost: estimatedTotal,
      over_budget: estimatedTotal > totalBudget,
      variance: totalBudget - estimatedTotal,
      message: estimatedTotal > totalBudget 
        ? `HEMS Analysis: This plan is ₹${(estimatedTotal - totalBudget).toLocaleString()} OVER the limit.` 
        : `HEMS Analysis: Plan fits within ₹${totalBudget.toLocaleString()} budget with ₹${(totalBudget - estimatedTotal).toLocaleString()} buffer.`
    };

    return data;
  }

  /**
   * Deterministic fallback planner if Gemini API is temporarily unavailable.
   */
  private static generateFallbackPlan(input: EventAnalysisInput): any {
    const guests = Math.max(1, Number(input.guest_count) || 100);
    const budget = Number(input.budget) || 100000;
    const type = (input.event_type || 'General').toLowerCase();
    const isHome = (input.location || '').toLowerCase().includes('home') || (input.location || '').toLowerCase().includes('house');

    const perPersonBudget = budget / guests;
    
    // Allocate budget dynamically
    let cateringCost = 0;
    let cateringNote = '';
    
    if (perPersonBudget < 200) {
      cateringCost = guests * 150;
      cateringNote = 'Basic snacks and tea (budget-optimized).';
    } else if (perPersonBudget < 500) {
      cateringCost = guests * 350;
      cateringNote = 'Standard lunch buffet (essential selection).';
    } else {
      cateringCost = guests * 600;
      cateringNote = 'Premium dinner buffet with multiple courses.';
    }

    const requirements: any[] = [
      {
        category: 'Food',
        item: `Catering: ${cateringNote}`,
        quantity: guests,
        unit: 'plates',
        estimated_unit_cost: cateringCost / guests,
        estimated_cost: cateringCost,
        priority: 'High',
        status: 'Pending',
        estimate_source: 'Assumed',
        notes: cateringNote
      }
    ];

    if (!isHome) {
      const venueCost = Math.min(budget * 0.25, 50000);
      requirements.push({
        category: 'Venue',
        item: 'Standard Hall Rental',
        quantity: 1,
        unit: 'booking',
        estimated_unit_cost: venueCost,
        estimated_cost: venueCost,
        priority: 'High',
        status: 'Pending',
        estimate_source: 'Assumed',
        notes: 'Includes basic seating and power.'
      });
    }

    // Add essentials if budget allows
    const currentTotal = requirements.reduce((s, r) => s + r.estimated_cost, 0);
    const remaining = budget - currentTotal;

    if (remaining > 5000) {
      requirements.push({
        category: 'Decoration',
        item: 'Essential Floral Decor',
        quantity: 1,
        unit: 'set',
        estimated_unit_cost: Math.min(remaining * 0.4, 15000),
        estimated_cost: Math.min(remaining * 0.4, 15000),
        priority: 'Medium',
        status: 'Pending',
        estimate_source: 'Assumed',
        notes: 'Basic entrance and stage decoration.'
      });
    }

    const finalTotal = requirements.reduce((s, r) => s + r.estimated_cost, 0);

    return {
      event_summary: {
        overview: `HEMS Fallback Plan for ${input.name}. Adjusted for a budget of ₹${budget.toLocaleString()}.`,
        budget_analysis: `This plan was deterministically generated to guarantee it fits within the ₹${budget.toLocaleString()} limit.`,
        is_budget_realistic: finalTotal <= budget,
        planning_complexity: 'Low',
        assumptions: [
          isHome ? 'Using home venue (0 rental cost)' : 'Standard venue availability',
          'Basic service levels used to stay within budget'
        ],
        follow_up_questions: [
          'Is the per-person catering allocation acceptable?',
          'Are there specific items you want to prioritize?'
        ]
      },
      requirements,
      tasks: [
        { title: 'Confirm Guest Count', category: 'General', priority: 'High', suggested_due_date: '2026-11-01', notes: 'Verify RSVPs for catering.' }
      ],
      budget_summary: {
        total_budget: budget,
        estimated_total_cost: finalTotal,
        over_budget: finalTotal > budget,
        variance: budget - finalTotal,
        message: `HEMS: Fallback plan strictly limited to ₹${finalTotal.toLocaleString()}.`
      }
    };
  }
}

