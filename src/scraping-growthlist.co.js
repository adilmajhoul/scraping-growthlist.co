import { paginationLoop, processLinks, writeDataToJson } from './utils';

// this part extracts all links of articles
const links = await paginationLoop(
  'https://growthlist.co/author/admin/page/1/',
);
// write links to json
writeDataToJson(links, '/extractedData/links.json');

processLinks(links)
  .then((data) => {
    return writeDataToJson(data, '/extractedData/companies.json');
  })
  .then(() => {
    console.timeEnd('Process Links');
    console.log('All data written to companies.json');
  })
  .catch((error) => {
    console.error('Error:', error);
  });
