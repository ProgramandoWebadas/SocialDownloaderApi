import dotenv from 'dotenv';
dotenv.config();
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';


const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0';
const chromeExecutablePath = process.env.CHROME_EXECUTABLE_PATH || '';

function customHTMLEncode(url) {
  const encodedUrl = encodeURIComponent(url);
  const customEncodedUrl = encodedUrl
    .replace(/%3A/g, '%253A')
    .replace(/%2F/g, '%252F')
    .replace(/%3F/g, '%253F')
    .replace(/%3D/g, '%253D');

  return customEncodedUrl;
}

const apiYtUrl = process.env.API_URL_YOUTUBE;

async function youtubedownloader(url) {
  const encodedUrl = customHTMLEncode(url);

  const finalUrl = apiYtUrl + encodedUrl;
  console.log("finalUrl", finalUrl)
  console.log("encodedUrl", encodedUrl)

  try {
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
      ],
      headless: true,
      ignoreHTTPSErrors: true,
      executablePath: chromeExecutablePath || (await chromium.executablePath),
      ignoreDefaultArgs: ["--disable-extensions"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setJavaScriptEnabled(true);
    await page.setRequestInterception(true);

    let postCallFound = false;

    page.on('request', async (request) => {
      if (request.url().includes('ajax/getLinks.php')) {
        //console.log("Url Request", request.url());
        //postCallFound = true; 
      }
      if (!postCallFound) {
        request.continue();
      }
    });

    await page.goto(finalUrl);
    await page.waitForTimeout(7500);

    const data = await page.evaluate(() => {
      const imageElement = document.querySelector('div.video-thumb img');
      const imageUrl = imageElement ? imageElement.getAttribute('src') : null;

      const titleElement = document.querySelector('div.title');
      const title = titleElement ? titleElement.getAttribute('title') : null;

      const durationElement = document.querySelector('div.video-duration');
      const durationText = durationElement ? durationElement.textContent.trim() : null;

      const durationMatch = durationText ? durationText.match(/Duration:\s+(\d+:\d+:\d+)/) : null;
      const duration = durationMatch ? durationMatch[1] : null;

      const tables = document.querySelectorAll(".downloadsTable");
      const sources = [];

      tables.forEach((table) => {
        const rows = table.querySelectorAll('tr');

        rows.forEach((row) => {
          const columns = row.querySelectorAll('td');

          if (columns.length > 0) {
            const downloadLink = columns[4].querySelector('a');

            if (downloadLink && downloadLink.href) {
              const rowData = {
                quality: columns[0].textContent.trim(),
                format: columns[1].textContent.trim(),
                size: columns[2].textContent.trim(),
                options: columns[3].textContent.trim(),
                download: downloadLink.href,
              };

              sources.push(rowData);
            }
          }
        });
      });

      return {
        imageUrl,
        title,
        duration,
        sources
      };
      //return sources;
    });

    console.log(JSON.stringify(data, null, 2)); 
    await browser.close();
    return data; 
  } catch (error) {
    console.error(error);
    return null;
  }
}
export default youtubedownloader; 






