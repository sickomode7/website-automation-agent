import { runAgent } from './agent';
import { openBrowser, closeBrowser } from './tools';

async function main() {
    try {
        await openBrowser();
        const prompt = "Navigate to https://ui.shadcn.com/docs/forms/react-hook-form, find the Bug Title and Description form fields, and fill them in with 'Tori' and 'AI-powered browser automation agent' respectively. Scroll as needed to find the fields.";
        await runAgent(prompt);
    } catch (error: any) {
        console.error('[ERROR] Fatal error in main execution:\n', error.stack || error);
    } finally {
        await closeBrowser();
    }
}

main();
