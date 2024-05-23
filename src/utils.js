import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

/**
 * Parses links from the given HTML content using Cheerio.
 *
 * @param {string} html - The HTML content to parse links from.
 * @return {Set} A Set containing unique links extracted from the HTML content.
 */
export async function parseLinks(html, selector) {
  // "div#search-results > ul li > a"
  const $ = cheerio.load(html);

  let links = $(selector).get();
  links = new Set(links.map((a) => $(a).attr('href')));

  return links;
}

/**
 * Writes the given products to a JSON file. If the file already exists,
 * it reads the existing products and appends the new products.
 *
 * @param {Array} products - The array of products to be written to the JSON file
 * @param {string} filePath - The file path where the products will be written
 */
export async function writeDataToJson(products, fileName) {
  // construct the path
  const filePath = path.join(__dirname, fileName);

  // If file already exists, read existing products and concatenate with new products
  let existingProducts = [];

  if (fs.existsSync(filePath)) {
    const json = fs.readFileSync(filePath, 'utf8');
    existingProducts = JSON.parse(json);
  }

  // Concatenate existing products with new products
  const allProducts = existingProducts.concat(products);

  // Write all products to JSON file
  fs.writeFileSync(filePath, JSON.stringify(allProducts, null, 2), 'utf8');
}

/**
 * Asynchronously fetches a webpage from the given URL, extracts HTML content using Cheerio, and
 * retrieves the URL for the next page.
 *
 * @param {string} url - The URL of the webpage to fetch
 * @return {Object} An object containing the fetched HTML, the URL of the next page, and the Cheerio object
 */
export async function getPage(url, nextPageUrlSelector) {
  const html = await fetch(url).then((res) => res.text());
  const $ = cheerio.load(html);

  const nextPageUrl = $(nextPageUrlSelector).attr('href');

  return { html, nextPageUrl, $ };
}

export async function paginationLoop(startingPageUrl) {
  let url = startingPageUrl;

  let allLinks = [];
  while (true) {
    const { html, nextPageUrl } = await getPage(url, 'div > a.next');

    let newLinks = await parseLinks(html, 'div > div.post-image > a');

    allLinks = [...allLinks, ...newLinks];

    if (!nextPageUrl) {
      break;
    } else {
      url = nextPageUrl;
    }
  }

  console.log({ all_links_to_scrape: allLinks });

  return allLinks;
}

export async function getHeadersOfTable($, selector) {
  const headers = $(selector)
    .map((i, element) => $(element).text().trim())
    .get();

  return headers;
}

export function getTableRow(row) {
  const name = row.eq(0).text().trim();
  const site = row.eq(1).text().trim();
  const industry = row.eq(2).text().trim();
  const country = row.eq(3).text().trim();
  const fundingAmount = row.eq(4).text().trim();
  const fundingType = row.eq(5).text().trim();
  const fundingDate = row.eq(6).text().trim();

  const company = {
    name,
    site,
    industry,
    country,
    fundingAmount,
    fundingType,
    fundingDate,
  };

  return company;
}

export async function getTableData(link) {
  const { $ } = await getPage(link);

  const tableData = [];

  $('tbody tr').each((i, element) => {
    const row = $(element).find('td');
    const company = getTableRow(row);
    tableData.push(company);
  });

  console.log({ table_scraped: tableData });

  return tableData;
}

export async function processLinks(links) {
  const promises = links.map((link) => getTableData(link));
  const results = await Promise.all(promises);
  return results.flat();
}

export async function processLinks(links) {
  const results = [];

  for (let i = 0; i < links.length; i += 5) {
    const batch = links.slice(i, i + 5);
    const promises = batch.map((link) => getTableData(link));
    const batchResults = await Promise.all(promises);

    writeDataToJson(batchResults, 'companies.json');

    results.push(...batchResults);
  }

  return results.flat();
}

export async function measureJsonLength(fileName, fullPath) {
  // construct the path
  const filePath = fileName ? path.join(__dirname, fileName) : fullPath;
  // Read JSON file synchronously
  const jsonData = fs.readFileSync(filePath, 'utf8');

  // Convert JSON string to JavaScript object
  const jsonObjectLength = JSON.parse(jsonData).length;
  console.log('🚀 ~ measureJsonLength ~ jsonObjectLength:', jsonObjectLength);

  return jsonObjectLength;
}
