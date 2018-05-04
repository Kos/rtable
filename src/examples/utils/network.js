export async function getCached(url) {
  const key = "cached-" + JSON.stringify(url);
  const value = sessionStorage.getItem(key);
  if (value !== null) {
    return JSON.parse(value);
  }
  const response = await fetch(url);
  const data = await response.json();
  sessionStorage.setItem(key, JSON.stringify(data));
  return data;
}
