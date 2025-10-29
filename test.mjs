import { chromium } from 'playwright';

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
    // 启动浏览器，配置启动参数
    const browser = await chromium.launch({
        headless: false,
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
        proxy: { server: 'http://127.0.0.1:7890' }, // 代理服务器
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
    await page.goto('https://www.reddit.com/r/Supabase/new/');
    // 获取页面标题
    console.log('页面标题:', await page.title());
    
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
                
                // 获取帖子内容预览
                const contentElement = post.querySelector('[data-click-id="body"] p, [slot="text-body"] p, p[class*="content"]');
                const content = contentElement ? contentElement.textContent.trim() : '';
                
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
    
    posts.forEach(post => {
        console.log('帖子编号:', post.index);
        console.log('发帖人:', post.author);
        console.log('发帖时间:', formatTimestamp(post.timestamp));
        console.log('发帖标题:', post.title);
        console.log('发帖内容:', post.content);
        console.log('发帖地址:', post.url);
        console.log('-'.repeat(80));
    });
    
    // 等待3秒
    await new Promise(resolve => setTimeout(resolve, 3000));
    // 关闭浏览器
    await browser.close();
})();