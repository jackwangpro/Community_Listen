import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// 你的 Supabase URL 和 匿名 key
const SUPABASE_URL = 'https://ivmgrsfffexuamrsotqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bWdyc2ZmZmV4dWFtcnNvdHFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMyMDE5MSwiZXhwIjoyMDcyODk2MTkxfQ.akAvl_eiN7JslncYIBQxnYEnm6tXuR-JUg7xFPPtq_c';

// 初始化 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// 格式化时间戳为 YYYY-MM-DD HH:mm:ss 格式
function formatTimestamp(timestamp) {
    if (!timestamp) return '未知时间';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

(async () => {
    let browser;
    try {
        // 启动浏览器，配置启动参数
        browser = await chromium.launch({
            headless: true,
            args: [ // 启动参数
                // 基础反检测
                '--no-blink-features=AutomationControlled',
                '--disable-blink-features=AutomationControlled',
                '--exclude-switches=enable-automation',
                '--disable-automation',

                // 禁用自动化标识
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor,AutomationControlled',
                '--disable-infobars',

                // 模拟真实用户环境
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-tools',

                // 禁用扩展和插件检测
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps',
                '--disable-component-extensions-with-background-pages',

                // 用户代理和语言
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                '--lang=zh-CN,zh;q=0.9,en;q=0.8',
                '--accept-lang=zh-CN,zh;q=0.9,en;q=0.8',

                // 性能和后台限制
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-ipc-flooding-protection',

                // 禁用各种检测功能
                '--disable-features=TranslateUI,BlinkGenPropertyTrees,AvoidUnnecessaryBeforeUnloadCheckSync,VizDisplayCompositor',
                '--disable-sync',
                '--disable-background-networking',

                // 禁用跟踪和遥测
                '--disable-client-side-phishing-detection',
                '--disable-component-update',
                '--disable-default-browser-check',
                '--disable-hang-monitor',
                '--metrics-recording-only',
                '--no-report-upload',

                // 媒体和通知
                '--disable-notifications',
                '--disable-popup-blocking',
                '--disable-prompt-on-repost',
                '--disable-domain-reliability',
                '--disable-background-media-suspend',

                // WebRTC和权限
                '--disable-webrtc-multiple-routes',
                '--disable-webrtc-hw-decoding',
                '--disable-webrtc-hw-encoding',
                '--disable-permissions-api',
                '--disable-webrtc-encryption',

                // 内存和缓存优化
                '--aggressive-cache-discard',
                '--memory-pressure-off',
                '--max_old_space_size=4096',

                // 字体和渲染
                '--disable-font-subpixel-positioning',
                '--force-color-profile=srgb',

                // 安全相关
                '--disable-site-isolation-trials',
                '--ignore-certificate-errors-spki-list',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors',

                // 网络相关
                '--disable-translate',

                // 其他高级反检测
                '--no-first-run',
                '--no-pings',
                '--password-store=basic',
                '--use-mock-keychain',
                '--disable-field-trial-config',
                '--disable-plugin-power-saver',
                '--disable-plugins-discovery',
                '--disable-preconnect'
            ]
        });

        // 新建浏览器上下文，配置指纹和代理
        const context = await browser.newContext({
            // proxy: { server: 'http://127.0.0.1:7890' }, // 代理服务器
            viewport: { width: 1920, height: 1080 }, // 视口大小
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', //用户代理
            locale: 'zh-CN', // 语言
            timezoneId: 'Asia/Shanghai', // 时区
            permissions: ['geolocation'], // 权限
            colorScheme: 'light', // 颜色方案
        });

        // 新建页面
        const page = await context.newPage();
        // 打开网页
        let navResponse = null;
        try {
            navResponse = await page.goto('https://www.reddit.com/r/Supabase/new/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        } catch (e) {
            console.error('页面导航失败:', e.message);
        }
        // 获取页面标题
        let pageTitle = '';
        try {
            pageTitle = await page.title();
        } catch (e) {
            console.error('获取页面标题失败:', e.message);
        }
        console.log('页面标题:', pageTitle);

        // 可用性监测：检测状态码与人机验证
        const status = navResponse ? navResponse.status() : null;
        const ok = navResponse ? navResponse.ok() : false;
        let bodySnippet = '';
        try {
            bodySnippet = await page.evaluate(() => document.body.innerText.slice(0, 300).toLowerCase());
        } catch (e) {
            console.warn('读取页面文本片段失败:', e.message);
        }
        const isHumanCheck = /prove your humanity|human verification|人机验证/.test((pageTitle || '').toLowerCase()) ||
                             /prove your humanity|human verification|人机验证/.test(bodySnippet || '');
        console.log(`可用性检测 -> status: ${status}, ok: ${ok}, human_check: ${isHumanCheck}`);

        // 打印页面源码前500个字符
        try {
            const htmlContent = await page.content();
            console.log('\n页面源码前500个字符:');
            console.log(htmlContent.substring(0, 500));
        } catch (e) {
            console.warn('读取页面源码失败:', e.message);
        }

        if (!ok || isHumanCheck) {
            console.error('页面不可用或触发人机验证，终止提取。');
            return;
        }

        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 提取帖子数据
        console.log('\n开始提取帖子数据...\n');
        const posts = await page.evaluate(() => {
            const results = [];

            // 尝试多种选择器以匹配不同的 Reddit 页面布局
            const postElements = Array.from(document.querySelectorAll('shreddit-post'));

            console.log(`找到 ${postElements.length} 个帖子元素`);

            postElements.forEach((post, index) => {
                try {
                    // 获取发帖人
                    let authorElement = post.querySelector('[data-testid="user-name"]') ||
                        post.querySelector('a[href*="/user/"]') ||
                        post.querySelector('a[href*="/u/"]');
                    const author = authorElement ? authorElement.textContent.trim() : '未知用户';

                    // 获取发帖时间
                    const timeElement = post.querySelector('time');
                    const timestamp = timeElement ? timeElement.getAttribute('datetime') : null;

                    // 获取发帖标题
                    let titleElement = post.querySelector('h3') ||
                        post.querySelector('[slot="title"]') ||
                        post.querySelector('a[data-testid="post-title"]') ||
                        post.querySelector('a[href*="/comments/"]');
                    const title = titleElement ? titleElement.textContent.trim() : '无标题';

                    // 获取帖子链接
                    let linkElement = post.querySelector('a[href*="/r/Supabase/comments/"]') ||
                        post.querySelector('a[data-testid="post-title"]') ||
                        post.querySelector('[slot="title"]');
                    const postUrl = linkElement ? (linkElement.href || linkElement.getAttribute('href')) : '';

                    // 获取帖子内容 - 尝试多种方式获取完整内容
                    let content = '';
                    const bodyElement = post.querySelector('[data-click-id="body"]');
                    if (bodyElement) content = bodyElement.innerText.trim();
                    if (!content) {
                        const textBodyElement = post.querySelector('[slot="text-body"]');
                        if (textBodyElement) content = textBodyElement.innerText.trim();
                    }
                    if (!content) {
                        const pElements = post.querySelectorAll('[data-click-id="body"] p, [slot="text-body"] p, p[class*="content"]');
                        if (pElements && pElements.length > 0) {
                            content = Array.from(pElements).map(p => p.textContent.trim()).join('\n');
                        }
                    }
                    if (!content) {
                        const allText = post.querySelector('[data-click-id="body"]') ||
                            post.querySelector('[slot="text-body"]') ||
                            post.querySelector('[class*="body"]') ||
                            post.querySelector('[class*="content"]');
                        if (allText) content = allText.innerText.trim();
                    }

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
                    console.log(`提取第 ${index + 1} 条帖子时出错:`, error.message);
                }
            });

            return results;
        });

        // 显示结果
        console.log('='.repeat(80));
        console.log(`共找到 ${posts.length} 条帖子\n`);

        // 准备要插入的数据
        const insertData = posts.map(post => ({
            community: 'reddit', // 固定值
            post_author: post.author,
            post_time: formatTimestamp(post.timestamp),
            post_text: post.content,
            post_title: post.title,
            post_url: post.url,
            post_index: post.index
        }));

        // 显示将要插入的数据
        insertData.forEach(data => {
            console.log('帖子编号:', data.post_index);
            console.log('发帖人:', data.post_author);
            console.log('发帖时间:', data.post_time);
            console.log('发帖标题:', data.post_title);
            console.log('发帖内容:', data.post_text);
            console.log('发帖地址:', data.post_url);
            console.log('-'.repeat(80));
        });

        // 逐条插入数据到 Supabase，并收集结果
        console.log('\n开始逐条保存数据到 Supabase...');
        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;
        const failDetails = [];

        for (const row of insertData) {
            try {
                const { error } = await supabase
                    .from('community_post')
                    .insert(row);
                if (error) {
                    if (error.code === '23505') {
                        skippedCount += 1;
                        console.log(`跳过已存在的数据：编号 ${row.post_index}`);
                    } else {
                        failCount += 1;
                        failDetails.push({ post_index: row.post_index, post_url: row.post_url, code: error.code, message: error.message });
                    }
                } else {
                    successCount += 1;
                }
            } catch (e) {
                failCount += 1;
                failDetails.push({ post_index: row.post_index, post_url: row.post_url, code: 'EXCEPTION', message: e.message });
            }
        }

        console.log(`逐条处理完成：新增 ${successCount} 条，跳过 ${skippedCount} 条（已存在），失败 ${failCount} 条`);
        if (failDetails.length > 0) {
            console.log('失败详情（最多显示前10条）：');
            failDetails.slice(0, 10).forEach(f => {
                console.log(`- 编号:${f.post_index} url:${f.post_url} code:${f.code} msg:${f.message}`);
            });
        }
    } catch (err) {
        console.error('运行时错误:', err && err.message ? err.message : err);
        if (err && err.stack) console.error(err.stack);
    } finally {
        try { if (browser) await browser.close(); } catch (e) { console.error('关闭浏览器失败:', e.message); }
    }
})();
