import { Browser, Page, chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Single shared browser/page instance at module level
let browser: Browser | null = null;
let page: Page | null = null;

function logTool(description: string) {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // HH:MM:SS
    console.log(`[${timeString}] [TOOL] ${description}`);
}

export async function openBrowser(): Promise<void> {
    try {
        logTool('openBrowser called');
        if (!browser) {
            browser = await chromium.launch({ headless: false });
            page = await browser.newPage();
        }
    } catch (error) {
        console.error('Error in openBrowser:', error);
    }
}

export async function navigateToUrl(url: string): Promise<void> {
    try {
        logTool(`navigateToUrl called with: ${url}`);
        if (page) {
            await page.goto(url, { waitUntil: 'networkidle' });
        } else {
            console.warn('Page is not initialized');
        }
    } catch (error) {
        console.error(`Error in navigateToUrl (${url}):`, error);
    }
}

export async function takeScreenshot(): Promise<Buffer> {
    try {
        logTool('takeScreenshot called');
        if (page) {
            const screenshotsDir = path.join(process.cwd(), 'screenshots');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }
            const screenshotPath = path.join(screenshotsDir, 'latest.png');
            const buffer = await page.screenshot({ path: screenshotPath });
            return buffer;
        } else {
            console.warn('Page is not initialized');
            return Buffer.from('');
        }
    } catch (error) {
        console.error('Error in takeScreenshot:', error);
        return Buffer.from('');
    }
}

export async function clickOnScreen(x: number, y: number): Promise<void> {
    try {
        logTool(`clickOnScreen called at (${x}, ${y})`);
        if (page) {
            await page.mouse.click(x, y);
        } else {
            console.warn('Page is not initialized');
        }
    } catch (error) {
        console.error(`Error in clickOnScreen (${x}, ${y}):`, error);
    }
}

export async function doubleClick(x: number, y: number): Promise<void> {
    try {
        logTool(`doubleClick called at (${x}, ${y})`);
        if (page) {
            await page.mouse.dblclick(x, y);
        } else {
            console.warn('Page is not initialized');
        }
    } catch (error) {
        console.error(`Error in doubleClick (${x}, ${y}):`, error);
    }
}

export async function sendKeys(text: string): Promise<void> {
    try {
        logTool(`sendKeys called with: ${text}`);
        if (page) {
            await page.keyboard.type(text);
        } else {
            console.warn('Page is not initialized');
        }
    } catch (error) {
        console.error('Error in sendKeys:', error);
    }
}

export async function scroll(direction: 'up' | 'down', amount: number = 300): Promise<void> {
    try {
        logTool(`scroll called, direction: ${direction}, amount: ${amount}`);
        if (page) {
            const deltaY = direction === 'down' ? amount : -amount;
            await page.mouse.wheel(0, deltaY);
        } else {
            console.warn('Page is not initialized');
        }
    } catch (error) {
        console.error('Error in scroll:', error);
    }
}

export async function closeBrowser(): Promise<void> {
    try {
        logTool('closeBrowser called');
        if (browser) {
            await browser.close();
            browser = null;
            page = null;
        }
    } catch (error) {
        console.error('Error in closeBrowser:', error);
    }
}
