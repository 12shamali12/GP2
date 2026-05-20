import { chromium } from "playwright";

const API = "http://localhost:3100";
const APP = "http://localhost:3101";

const accounts = {
  admin: { id: "0795658040", pw: "Shamali5658040@", path: "/admin" },
  doctor: { id: "0791100201", pw: "Doctor1!", path: "/doctor" },
};

let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  browser = await chromium.launch();
}

for (const [role, acc] of Object.entries(accounts)) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: acc.id, password: acc.pw }),
  });
  const data = await res.json();
  if (!data.token) {
    console.error(role, "login failed");
    continue;
  }
  const page = await browser.newPage({ viewport: { width: 1680, height: 1100 } });
  await page.goto(`${APP}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ token, user }) => {
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("currentUser", JSON.stringify(user));
    },
    { token: data.token, user: data.user },
  );
  await page.goto(`${APP}${acc.path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2600);
  await page.mouse.move(1400, 400);
  await page.screenshot({ path: `shot-${role}.png`, fullPage: true });
  console.log(`${role}: shot-${role}.png`);
  await page.close();
}

await browser.close();
