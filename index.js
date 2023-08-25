import { caching } from 'cache-manager';

// Simulate sleep
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// In memory cache
const memoryCache = await caching('memory', {
  max: 100,
  ttl: 3 * 1000 /*milliseconds*/,
});

// Simulate cache from third party such as Redis
// longer ttl
const thirdPartyCache = await caching('memory', {
  max: 100,
  ttl: 5 * 1000 /*milliseconds*/,
});

// Simulate query to database
function getDataFromDB(key) {
  return new Promise((resolve) => {
    resolve(`Data for ${key}`);
  });
}

async function getData(key) {
  let data = await memoryCache.get(key);
  if (data) {
    console.log('Data found in memory cache');
    return data;
  }

  data = await thirdPartyCache.get(key);
  if (data) {
    console.log('Data found in third party cache');
    // Write data back to memory cache
    memoryCache.set(key, data);
    return data;
  }

  data = await getDataFromDB(key);
  console.log('Data fetched from database');
  // Write data to memory cache and third party cache
  memoryCache.set(key, data);
  thirdPartyCache.set(key, data);
  return data;
}

await getData('key1'); // simulate first request, data fetched from database
await getData('key1'); // simulate second request, data fetched from memory cache

await sleep(3000); // wait for 3 seconds to let the in memory cache expire, third party cache still valid for 2 more seconds

await getData('key1'); // simulate third request, data fetched from third party cache, memory cache updated
await getData('key1'); // simulate fourth request, data fetched from memory cache

await sleep(2000); // wait for 2 seconds to let the third party cache expire, memory cache still valid for 1 more second

await getData('key1'); // simulate fifth request, data fetched from memory cache

await sleep(1000); // wait for 1 second to let the memory cache expire, now both caches are expired

await getData('key1'); // simulate sixth request, data fetched from database, memory cache and third party cache updated