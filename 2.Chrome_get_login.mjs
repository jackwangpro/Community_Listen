import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    try {
        // 连接到远程Chrome
        const res = await fetch('http://127.0.0.1:9222/json/version');
        const wsUrl = res.json().then(data => data.webSocketDebuggerUrl);
        const browser = await chromium.connectOverCDP(await wsUrl);

        // 获取当前页面
        const context = browser.contexts()[0];
        const page = context.pages()[0];

        console.log(`找到页面: ${page.url()}`);
        console.log('页面已打开，直接提取数据...');

        // 获取当前URL
        const currentUrl = page.url();
        const domain = new URL(currentUrl).hostname.replace('www.', '');

        console.log('正在提取环境数据...');
        console.log(`当前页面: ${currentUrl}`);

        // 1. 保存所有Cookies（包括所有域名）
        const cookies = await context.cookies();
        const cookieData = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            cookies: cookies,
            totalCount: cookies.length,
            domains: [...new Set(cookies.map(c => c.domain))]
        };

        // 2. 提取LocalStorage（所有域名）
        const localStorage = await page.evaluate(() => {
            const items = {};
            try {
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    items[key] = window.localStorage.getItem(key);
                }
            } catch (e) {
                console.warn('LocalStorage读取失败:', e.message);
            }
            return items;
        });

        // 3. 提取SessionStorage
        const sessionStorage = await page.evaluate(() => {
            const items = {};
            try {
                for (let i = 0; i < window.sessionStorage.length; i++) {
                    const key = window.sessionStorage.key(i);
                    items[key] = window.sessionStorage.getItem(key);
                }
            } catch (e) {
                console.warn('SessionStorage读取失败:', e.message);
            }
            return items;
        });

        // 4. 提取浏览器环境信息（用于还原浏览器指纹）
        const browserEnv = await page.evaluate(() => {
            return {
                // 用户代理
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                languages: navigator.languages,

                // 视口信息
                screenWidth: screen.width,
                screenHeight: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,

                // 窗口信息
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight,

                // 时区和时间信息
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset(),

                // 硬件信息
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory || 'unknown',
                maxTouchPoints: navigator.maxTouchPoints || 0,

                // WebGL信息（用于指纹识别）
                webglVendor: (() => {
                    try {
                        const canvas = document.createElement('canvas');
                        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                        if (gl) {
                            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                            return {
                                vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
                                renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown'
                            };
                        }
                    } catch (e) { }
                    return null;
                })(),

                // Canvas指纹
                canvasFingerprint: (() => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        ctx.textBaseline = 'top';
                        ctx.font = '14px Arial';
                        ctx.fillText('Browser fingerprint', 2, 2);
                        return canvas.toDataURL().substring(0, 50);
                    } catch (e) {
                        return null;
                    }
                })(),

                // 插件信息
                plugins: Array.from(navigator.plugins || []).map(p => ({
                    name: p.name,
                    filename: p.filename,
                    description: p.description
                })),

                // MIME类型
                mimeTypes: Array.from(navigator.mimeTypes || []).map(m => ({
                    type: m.type,
                    description: m.description,
                    suffixes: m.suffixes
                })),

                // 其他navigator属性
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,
                onLine: navigator.onLine,

                // 页面信息
                referrer: document.referrer,
                title: document.title,
                url: window.location.href
            };
        });

        // 5. 获取上下文配置信息
        const contextInfo = {
            viewport: {
                width: browserEnv.innerWidth,
                height: browserEnv.innerHeight
            },
            userAgent: browserEnv.userAgent,
            locale: browserEnv.language,
            timezoneId: browserEnv.timezone,
            colorScheme: 'light',
            permissions: [],
            geolocation: null,
            extraHTTPHeaders: {},
            httpCredentials: null
        };

        // 6. 提取页面状态信息
        const pageInfo = {
            url: currentUrl,
            title: await page.title(),
            timestamp: Date.now(),
            date: new Date().toISOString()
        };

        // 组装所有环境数据
        const environmentData = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            domain: domain,
            pageInfo: pageInfo,
            cookies: cookieData,
            storage: {
                localStorage: localStorage,
                sessionStorage: sessionStorage,
                localStorageCount: Object.keys(localStorage).length,
                sessionStorageCount: Object.keys(sessionStorage).length
            },
            browserEnv: browserEnv,
            contextInfo: contextInfo
        };

        // 确保目录存在
        const storageDir = './storage';
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        // 写入完整环境数据文件
        const filename = `${storageDir}/all_login_environment.json`;
        fs.writeFileSync(filename, JSON.stringify(environmentData, null, 2));

        // 显示保存的信息摘要
        console.log('\n' + '='.repeat(80));
        console.log('✅ 环境数据已保存');
        console.log('='.repeat(80));
        console.log(`📄 保存文件: ${filename}`);
        console.log('='.repeat(80));
        console.log('📊 数据统计:');
        console.log(`   Cookies: ${cookies.length} 个 (${cookieData.domains.length} 个域名)`);
        console.log(`   LocalStorage: ${Object.keys(localStorage).length} 项`);
        console.log(`   SessionStorage: ${Object.keys(sessionStorage).length} 项`);
        console.log('='.repeat(80));
        console.log('🌐 浏览器环境:');
        console.log(`   用户代理: ${browserEnv.userAgent.substring(0, 60)}...`);
        console.log(`   平台: ${browserEnv.platform}`);
        console.log(`   语言: ${browserEnv.language}`);
        console.log(`   时区: ${browserEnv.timezone}`);
        console.log(`   屏幕: ${browserEnv.screenWidth}x${browserEnv.screenHeight}`);
        console.log(`   视口: ${browserEnv.innerWidth}x${browserEnv.innerHeight}`);
        console.log(`   WebGL: ${browserEnv.webglVendor ? '已检测' : '未检测'}`);
        console.log(`   插件: ${browserEnv.plugins.length} 个`);
        console.log('='.repeat(80) + '\n');

        await browser.close();
    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('❌ 错误:', error.message);
        if (error.stack) {
            console.error('\n错误堆栈:');
            console.error(error.stack);
        }
        console.error('='.repeat(80) + '\n');
        process.exit(1);
    }
})();