import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(pathToFileURL(process.argv[3]).href);
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
  const duration = await page.locator('video').evaluate(video => { video.pause(); return video.duration; });
  console.log(JSON.stringify({ duration }));
  for (const ratio of [0.25, 0.5, 0.75]) {
    await page.locator('video').evaluate(async (video, ratio) => {
      await new Promise(resolve => { video.addEventListener('seeked', resolve, { once: true }); video.currentTime = video.duration * ratio; });
    }, ratio);
    await page.screenshot({ path: `sandbox-runtime/recording-${ratio}.png` });
  }
} finally { await browser.close(); }
