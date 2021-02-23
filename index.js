const puppeteer = require("puppeteer");

const PAGE_URL = "https://emojipedia.org/food-drink";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(PAGE_URL);
  await page.waitForSelector(".emoji-list");

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("ul.emoji-list > li > a"), (a) =>
      a.getAttribute("href")
    )
  );

  const results = {};

  for (const href of hrefs) {
    await page.goto(`https://emojipedia.org${href}`);
    await page.addScriptTag({
      url:
        "https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js",
    });
    await page.waitForSelector(".vendor-list");

    const res = await page.evaluate(async () => {
      const emoji = document.querySelector("h1 > span.emoji").textContent;

      const appleRow = document.querySelector(
        ".vendor-list ul > li:first-child"
      );
      const appleEmojiImg = appleRow.querySelector("img");

      const color = await new Promise((resolve) => {
        const colorThief = new ColorThief();

        const img = new Image();

        img.addEventListener("load", function () {
          resolve(colorThief.getColor(img));
        });

        // Hack found in https://lokeshdhakar.com/projects/color-thief/ point "Does it work if the image is hosted on another domain?"
        let googleProxyURL =
          "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=";

        img.crossOrigin = "Anonymous";
        img.src =
          googleProxyURL +
          encodeURIComponent(appleEmojiImg.getAttribute("src"));
      });

      return { emoji, color };
    });

    results[href] = res;
  }

  console.log(JSON.stringify(results));

  await browser.close();
})();
