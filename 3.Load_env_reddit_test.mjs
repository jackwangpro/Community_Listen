import { chromium } from 'playwright';
import fs from 'fs';

// 加载保存的环境数据
function loadEnvironment() {
    const envFile = './storage/all_login_environment.json';
    if (!fs.existsSync(envFile)) return null;
    try {
        return JSON.parse(fs.readFileSync(envFile, 'utf-8'));
    } catch (e) {
        return null;
    }
}

(async () => {
    let browser;
    try {
        // 加载保存的环境数据
        const envData = loadEnvironment();

        // 启动浏览器（反爬配置）
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-blink-features=AutomationControlled',
                '--disable-blink-features=AutomationControlled',
                '--exclude-switches=enable-automation',
                '--disable-automation',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor,AutomationControlled',
                '--disable-infobars',
                '--disable-dev-shm-usage',
                '--no-sandbox'
            ]
        });

        // 新建浏览器上下文
        const contextOptions = {
            // proxy: { server: 'http://127.0.0.1:7890' }, // 代理服务器
            viewport: envData?.contextInfo?.viewport || { width: 1920, height: 1080 },
            userAgent: envData?.browserEnv?.userAgent || envData?.contextInfo?.userAgent,
            locale: envData?.contextInfo?.locale || envData?.browserEnv?.language,
            timezoneId: envData?.contextInfo?.timezoneId || envData?.browserEnv?.timezone
        };
        if (envData?.contextInfo?.extraHTTPHeaders) {
            contextOptions.extraHTTPHeaders = envData.contextInfo.extraHTTPHeaders;
        }

        const context = await browser.newContext(contextOptions);
        if (envData?.cookies?.cookies?.length > 0) {
            await context.addCookies(envData.cookies.cookies);
        }

        // 新建页面
        const page = await context.newPage();

        // 反检测脚本和存储数据恢复（在页面初始化时执行）
        await page.addInitScript((initData) => {
            // 反检测
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'plugins', {
                get: () => initData.plugins?.length > 0 ? initData.plugins : [{ name: 'Chrome PDF Plugin' }, { name: 'Chrome PDF Viewer' }, { name: 'Native Client' }]
            });

            // 恢复存储数据
            if (initData.localStorage) {
                Object.entries(initData.localStorage).forEach(([k, v]) => {
                    try { window.localStorage.setItem(k, v); } catch (e) { }
                });
            }
            if (initData.sessionStorage) {
                Object.entries(initData.sessionStorage).forEach(([k, v]) => {
                    try { window.sessionStorage.setItem(k, v); } catch (e) { }
                });
            }
        }, {
            plugins: envData?.browserEnv?.plugins || [],
            localStorage: envData?.storage?.localStorage || {},
            sessionStorage: envData?.storage?.sessionStorage || {}
        });

        // 打开网页
        try {
            await page.goto('https://www.reddit.com/r/Supabase/new/', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
        } catch (e) {
            console.error('访问页面失败：', e.message);
            return;
        }

        // 等待页面加载并滚动以触发懒加载
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 多次滚动加载更多内容
        let lastHeight = 0;
        let currentHeight = 0;
        let scrollAttempts = 0;
        const maxScrollAttempts = 5;

        while (scrollAttempts < maxScrollAttempts) {
            lastHeight = await page.evaluate(() => document.body.scrollHeight);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise(resolve => setTimeout(resolve, 2000));
            currentHeight = await page.evaluate(() => document.body.scrollHeight);

            if (currentHeight === lastHeight) {
                break;
            }
            scrollAttempts++;
        }

        // 提取帖子数据
        const posts = await page.evaluate(() => {
            const results = [];
            const postElements = Array.from(document.querySelectorAll('shreddit-post'));

            postElements.forEach((post, index) => {
                try {
                    const author = (post.querySelector('[data-testid="user-name"]') || post.querySelector('a[href*="/user/"]') || post.querySelector('a[href*="/u/"]'))?.textContent?.trim() || '未知用户';
                    const timestamp = post.querySelector('time')?.getAttribute('datetime') || null;
                    const title = (post.querySelector('h3') || post.querySelector('[slot="title"]') || post.querySelector('a[data-testid="post-title"]'))?.textContent?.trim() || '无标题';
                    const postUrl = (post.querySelector('a[href*="/r/Supabase/comments/"]') || post.querySelector('a[data-testid="post-title"]'))?.href || '';
                    const content = (post.querySelector('[data-click-id="body"]') || post.querySelector('[slot="text-body"]'))?.innerText?.trim() || '';

                    if (title && title !== '无标题') {
                        results.push({
                            index: index + 1,
                            author: author,
                            timestamp: timestamp,
                            title: title,
                            content: content || '无内容',
                            url: postUrl || ''
                        });
                    }
                } catch (error) {
                    // 静默忽略提取错误
                }
            });

            return results;
        });

        // 显示提取的数据列表
        console.log(`\n共提取到 ${posts.length} 条帖子：\n`);
        posts.forEach((post, index) => {
            console.log(`${index + 1}. ${post.title}`);
            console.log(`   作者: ${post.author} | 时间: ${post.timestamp || '未知时间'}`);
            console.log(`   链接: ${post.url}`);
            if (post.content && post.content !== '无内容') {
                const contentPreview = post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content;
                console.log(`   内容: ${contentPreview}`);
            }
            console.log('');
        });
    } catch (err) {
        console.error('错误:', err.message);
    } finally {
        if (browser) await browser.close();
    }
})();
