import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import * as tools from './tools';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'openBrowser',
        description: 'Launch the browser instance and open a new page.',
    },
    {
        name: 'navigateToUrl',
        description: 'Navigate the current browser page to a specified URL.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                url: { type: SchemaType.STRING, description: 'The URL to navigate to (must include http/https)' },
            },
            required: ['url'],
        },
    },
    {
        name: 'takeScreenshot',
        description: 'Take a screenshot of the current browser page.',
    },
    {
        name: 'clickOnScreen',
        description: 'Click at pixel coordinates on the current browser screen.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                x: { type: SchemaType.NUMBER, description: 'X coordinate' },
                y: { type: SchemaType.NUMBER, description: 'Y coordinate' },
            },
            required: ['x', 'y'],
        },
    },
    {
        name: 'doubleClick',
        description: 'Double click at pixel coordinates on the current browser screen.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                x: { type: SchemaType.NUMBER, description: 'X coordinate' },
                y: { type: SchemaType.NUMBER, description: 'Y coordinate' },
            },
            required: ['x', 'y'],
        },
    },
    {
        name: 'sendKeys',
        description: 'Type text into the current focused element.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                text: { type: SchemaType.STRING, description: 'The text to type' },
            },
            required: ['text'],
        },
    },
    {
        name: 'scroll',
        description: 'Scroll the page up or down.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                direction: { type: SchemaType.STRING, description: 'Direction to scroll: "up" or "down"' },
                amount: { type: SchemaType.NUMBER, description: 'Amount of pixels to scroll (e.g., 300)' },
            },
            required: ['direction'],
        },
    },
    {
        name: 'closeBrowser',
        description: 'Close the browser instance.',
    },
];

// Initialize the model (Gemini 2.5 Flash)
export const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ functionDeclarations }],
    systemInstruction: 'You are a browser automation agent. Use the provided tools to complete web tasks step by step. Always take a screenshot before and after each action to verify state.',
});

export async function runAgent(objective: string) {
    console.log(`Starting agent with objective: ${objective}`);
    
    let isTaskComplete = false;
    let consecutiveNoActionTurns = 0;
    
    const history: any[] = [];
    
    let screenshotBuffer = await tools.takeScreenshot();
    let messageParts: any[] = [
        { text: objective }
    ];
    if (screenshotBuffer.length > 0) {
        messageParts.push({
            inlineData: {
                mimeType: "image/png",
                data: screenshotBuffer.toString("base64")
            }
        });
    }

    while (!isTaskComplete) {
        console.log(`\n[Agent] Sending message to Gemini (Parts: ${messageParts.length})`);
        
        try {
            history.push({
                role: "user",
                parts: messageParts
            });

            const result = await model.generateContent({ contents: history });
            const response = result.response;
            
            if (response.candidates && response.candidates[0].content) {
                history.push(response.candidates[0].content);
            }
            
            const functionCalls = response.functionCalls();
            
            try {
                const text = response.text();
                if (text) {
                    console.log(`[Gemini Text]:\n${text}`);
                }
            } catch (e) {}

            if (functionCalls && functionCalls.length > 0) {
                consecutiveNoActionTurns = 0;
                
                const fnResponseParts: any[] = [];
                
                for (const call of functionCalls) {
                    console.log(`[Function Call]: ${call.name}(${JSON.stringify(call.args)})`);
                    let toolResult: any = {};
                    
                    let attempts = 0;
                    while (attempts < 2) {
                        attempts++;
                        try {
                            const args: any = call.args;
                            switch (call.name) {
                                case 'openBrowser':
                                    await tools.openBrowser();
                                    toolResult = { success: true };
                                    break;
                                case 'navigateToUrl':
                                    await tools.navigateToUrl(args.url);
                                    toolResult = { success: true };
                                    break;
                                case 'takeScreenshot':
                                    await tools.takeScreenshot();
                                    toolResult = { success: true };
                                    break;
                                case 'clickOnScreen':
                                    await tools.clickOnScreen(args.x, args.y);
                                    toolResult = { success: true };
                                    break;
                                case 'doubleClick':
                                    await tools.doubleClick(args.x, args.y);
                                    toolResult = { success: true };
                                    break;
                                case 'sendKeys':
                                    await tools.sendKeys(args.text);
                                    toolResult = { success: true };
                                    break;
                                case 'scroll':
                                    await tools.scroll(args.direction, args.amount);
                                    toolResult = { success: true };
                                    break;
                                case 'closeBrowser':
                                    await tools.closeBrowser();
                                    toolResult = { success: true };
                                    break;
                                default:
                                    console.warn(`[Warning] Unknown function call: ${call.name}`);
                                    toolResult = { error: `Unknown function name: ${call.name}` };
                            }
                            break;
                        } catch (err: any) {
                            if (attempts === 1) {
                                console.warn(`[Warning] Tool ${call.name} failed on attempt 1. Retrying...`);
                            } else {
                                console.error(`[ERROR] Tool ${call.name} failed after 2 attempts.\n${err.stack || err.message}`);
                                throw err;
                            }
                        }
                    }

                    console.log(`[Function Result]: ${JSON.stringify(toolResult)}`);

                    fnResponseParts.push({
                        functionResponse: {
                            name: call.name,
                            response: toolResult
                        }
                    });
                }

                // Add the function responses as a user turn
                history.push({
                    role: "user",
                    parts: fnResponseParts
                });
                
                // Add a dummy model turn to satisfy alternating roles
                history.push({
                    role: "model",
                    parts: [{ text: "I have received the function execution results. Please provide the latest screenshot so I can verify the state." }]
                });

                screenshotBuffer = await tools.takeScreenshot();
                messageParts = [];
                if (screenshotBuffer.length > 0) {
                    messageParts.push({
                        inlineData: {
                            mimeType: "image/png",
                            data: screenshotBuffer.toString("base64")
                        }
                    });
                } else {
                    messageParts.push({ text: "No screenshot available." });
                }
            } else {
                consecutiveNoActionTurns++;
                if (consecutiveNoActionTurns >= 3) {
                    console.warn(`[WARNING] Gemini returned no function call for 3 consecutive turns. Breaking the loop.`);
                    break;
                } else {
                    console.log(`[Agent] No function calls. (Turn ${consecutiveNoActionTurns}/3)`);
                    messageParts = [
                        { text: "No function calls detected. Please use the provided tools to progress the task, or indicate if the task is complete." }
                    ];
                }
            }
        } catch (error: any) {
            console.error(`[ERROR] Error communicating with Gemini:\n${error.stack || error.message}`);
            throw error;
        }
    }
}
