export async function fetchRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delayMs = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      if (i < retries - 1) await sleep(delayMs * (i + 1));
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(delayMs * (i + 1));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
