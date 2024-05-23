import { paginationLoop, processLinks, writeDataToJson } from './utils';

const startingPage = 'https://growthlist.co/author/admin/page/1/';
// this part extracts all links of articles
const links = await paginationLoop(startingPage);
// write links to json
writeDataToJson(links, '/extractedData/links.json');

processLinks(links)
  .then((data) => {
    return writeDataToJson(data, '/extractedData/companies.json');
  })
  .then(() => {
    console.log('All data written to /extractedData/companies.json');
  })
  .catch((error) => {
    console.error('Error:', error);
  });
