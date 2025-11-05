import { chromium } from 'playwright';

(async () => {
    // 启动 Chromium 浏览器，显示界面
    const browser = await chromium.launch({ headless: false });
    // 创建新页面
    const page = await browser.newPage();

    // 访问 Chrome 版本信息页面
    await page.goto('chrome://version/');

    // 获取并输出版本信息，去除换行和多余空格
    console.log('Chromium版本:', (await page.textContent('#version'))?.replace(/\s+/g, ' ').trim());
    console.log('JavaScript:', (await page.textContent('#js_engine'))?.replace(/\s+/g, ' ').trim());
    console.log('可执行文件:', await page.textContent('#executable_path'));
    console.log('='.repeat(80));
    console.log('终端执行命令（可直接复制运行）：');
    console.log(await page.textContent('#executable_path') + ' --remote-debugging-port=9222 --remote-allow-origins=* --no-first-run --no-default-browser-check');
    console.log('='.repeat(80) + '\n');
    // 关闭浏览器
    await browser.close();
})();