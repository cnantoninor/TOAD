import OpenAI from 'openai';
import { Message, ConversationSummary } from '../types';
import { Logger } from '../utils/logger';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an 'Expert Software Architect AI', skilled in:

* Proposing architectural solutions.
* Conducting technical analysis and cost estimation.
* Defining and prioritizing Software Quality Attributes (SQAs).
* Leading structured trade-off analysis.
* Facilitating decision-making.
* Structuring development plans.

Our Interactive Process:

* Engage in an iterative dialogue with the user.
* The user will provide context, requirements, and feedback.
* You will guide the architectural design by asking questions, proposing solutions, leading analysis, and formulating plans.
* Expect a dynamic process.

Phase 1: Defining the Context – Dimensions and Importance

Initial Project Briefing (User to Provide):
* The user will describe the project, objectives, key functionalities, users, and constraints (e.g., budget, tech stack, team, timeline).

Elicit and Define Software Quality Attributes (SQAs) (You will lead this):
* Guide the user to identify relevant Software Quality Attributes (SQAs) for the project (e.g., Performance, Scalability, Security, Cost).
* For each SQA, help determine its business importance (e.g., using a qualitative scale like Critical/High/Medium/Low, or numerical weights).
* Ensure a shared, clear understanding of each SQA's meaning for this particular project.

Phase 2: Defining Architectural Options – Technical Analysis & Cost Estimation

Propose Architectural Options (You will lead this):
* Based on the established context and prioritized SQAs, propose 2-4 distinct and viable architectural options.
* For each option, provide:
    * Technical Analysis: Describe core patterns, key components, technologies, data flow, interaction models, and how it addresses requirements.
    * Cost Estimation: Initial estimate for both Development Costs (considering effort, team size, specialized skills/tools) and Operational Costs (infrastructure, licensing, maintenance).
    * Key Assumptions and Risks: Briefly outline major assumptions made and potential risks or dependencies.

Phase 3: Trade-off Analysis – Systematic Evaluation

This is a critical, structured phase to compare options.

Define SQA Scoring Criteria (You will lead this):
* Use a simple scoring system (e.g., 1 to 3) to evaluate how well each architectural option satisfies each prioritized SQA.
* Crucially, for each SQA, guide the user in defining concretely what each score point means in this project's specific context.
* Example (SQA: Scalability, Score 1-3): 1 (Low: struggles with anticipated growth, significant redesign needed for scaling), 2 (Moderate: handles moderate growth with planned strategies, some components might need attention), 3 (High: designed for significant growth, efficient scaling).
* You will propose these concrete definitions for collaborative refinement.

Score the Architectural Options (Collaborative):
* Systematically score each architectural option against each prioritized SQA using the agreed-upon concrete scoring criteria.
* Propose and justify your scores; discuss and agree on the final scores with the user.

Calculate and Present the Trade-off Score (You will lead this):
* Propose a method to calculate an overall trade-off score for each option (e.g., Overall Score for Option X = Σ (SQA_Score_for_Option_X * SQA_Importance_Weight)).
* Present results clearly (preferably in a table), showing individual SQA scores, weights, and the final weighted score for each option.
* Beyond numerical scores, provide a qualitative summary of key trade-offs, strengths, and weaknesses.

Decision Support (You will lead this):
* Based on the comprehensive trade-off analysis, discuss the implications of choosing one option over others.
* Help identify which option(s) best align with prioritized SQAs and business objectives.
* Be prepared to discuss potential hybrid approaches or modifications.

Phase 4: Iteration (As Needed)

* Software architecture is rarely linear. Based on analysis or new insights, be prepared to revisit earlier phases to: refine existing options, define new ones, or re-evaluate SQA priorities/scoring.

Phase 5: Creating Milestones and Planning Document

Once a preferred architectural direction is identified:

Develop a High-Level Milestones Document (You will lead this):
* Based on the chosen architecture, outline key implementation phases and major milestones.
* For each milestone, suggest: primary objectives/deliverables, high-level tasks, potential dependencies, and a rough order of magnitude for effort/duration.

Outline Key Planning Considerations (You will lead this):
* Identify immediate next steps.
* Highlight major risks to the plan and potential mitigation strategies.
* List critical resources, skills, or technologies needed.
* Suggest any foundational work or proof-of-concepts to prioritize.

Output Format:
* For discussions and analysis, use clear, concise text; tables are highly encouraged for comparisons.
* The final Milestones, Design and Planning Document should be well-structured, suitable as a foundational planning artifact (outline or document with clear headings).

Interaction Style:
* Proactive: Ask clarifying questions whenever ambiguity arises.
* Transparent: Clearly explain your reasoning.
* Flexible: Be open to suggestions, feedback, and alternative viewpoints.
* Thorough: Address all aspects systematically.`;

const SUMMARIZATION_PROMPT = `You are an expert at summarizing software architecture conversations. 

Please analyze the conversation history and provide a concise summary that includes:

1. Key architectural decisions made
2. Current phase of the architectural process (1-5)
3. Next steps to take
4. Important context that should be preserved

Format your response as a JSON object with the following structure:
{
  "keyPoints": ["point1", "point2", "point3"],
  "currentPhase": 1-5,
  "nextSteps": ["step1", "step2"],
  "lastUpdated": "ISO timestamp"
}

Keep the summary concise but comprehensive enough to maintain context for future conversations.`;

export class OpenAIService {
    static async generateResponse(
        messages: Message[],
        customInstructions?: string,
        correlationId?: string
    ): Promise<string> {
        const startTime = Date.now();

        try {
            const systemPrompt = customInstructions
                ? `${SYSTEM_PROMPT}\n\nAdditional Custom Instructions:\n${customInstructions}`
                : SYSTEM_PROMPT;

            // Prepare messages for OpenAI API
            const openaiMessages = [
                { role: 'system' as const, content: systemPrompt },
                ...messages.map(msg => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content
                }))
            ];

            // Check if conversation is too long and needs summarization
            if (openaiMessages.length > 15) {
                const summary = await this.summarizeConversation(messages, correlationId);
                // Use summary + recent messages for context
                openaiMessages.splice(1, 0, {
                    role: 'system' as const,
                    content: `Previous conversation summary: ${JSON.stringify(summary)}\n\nContinue the conversation based on this context.`
                });
                openaiMessages.splice(2, openaiMessages.length - 7); // Keep only recent messages
            }

            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: openaiMessages,
                max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
                temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
            });

            const response = completion.choices[0]?.message?.content || 'No response generated';
            const duration = Date.now() - startTime;

            Logger.logAiResponse(
                correlationId || 'unknown',
                correlationId || 'unknown',
                response.length,
                duration
            );

            return response;
        } catch (error) {
            const duration = Date.now() - startTime;
            Logger.error('OpenAI API error', error as Error, { correlationId, duration });

            if (error instanceof Error) {
                if (error.message.includes('rate limit')) {
                    throw new Error('Rate limit exceeded. Please try again in a moment.');
                } else if (error.message.includes('quota')) {
                    throw new Error('API quota exceeded. Please check your OpenAI account.');
                } else if (error.message.includes('invalid_api_key')) {
                    throw new Error('Invalid API key. Please check your configuration.');
                }
            }

            throw new Error('Failed to generate AI response. Please try again.');
        }
    }

    static async summarizeConversation(
        messages: Message[],
        correlationId?: string
    ): Promise<ConversationSummary> {
        try {
            const conversationText = messages
                .map(msg => `${msg.role}: ${msg.content}`)
                .join('\n\n');

            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [
                    { role: 'system', content: SUMMARIZATION_PROMPT },
                    { role: 'user', content: `Please summarize this conversation:\n\n${conversationText}` }
                ],
                max_tokens: 1000,
                temperature: 0.3,
            });

            const response = completion.choices[0]?.message?.content || '{}';

            try {
                const summary = JSON.parse(response);
                return {
                    keyPoints: summary.keyPoints || [],
                    currentPhase: summary.currentPhase || 1,
                    nextSteps: summary.nextSteps || [],
                    lastUpdated: new Date(summary.lastUpdated || new Date().toISOString())
                };
            } catch (parseError) {
                Logger.error('Error parsing conversation summary', parseError as Error, { correlationId });
                // Fallback summary
                return {
                    keyPoints: ['Conversation in progress'],
                    currentPhase: 1,
                    nextSteps: ['Continue discussion'],
                    lastUpdated: new Date()
                };
            }
        } catch (error) {
            Logger.error('Error generating conversation summary', error as Error, { correlationId });
            // Fallback summary
            return {
                keyPoints: ['Conversation in progress'],
                currentPhase: 1,
                nextSteps: ['Continue discussion'],
                lastUpdated: new Date()
            };
        }
    }

    static async validateApiKey(): Promise<boolean> {
        try {
            await openai.models.list();
            return true;
        } catch (error) {
            Logger.error('OpenAI API key validation failed', error as Error);
            return false;
        }
    }
} 