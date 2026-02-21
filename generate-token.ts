import { SignJWT } from "jose";

async function generate() {
  const secret = new TextEncoder().encode("dragon_telegram_pro_secret_key_2024");
  const token = await new SignJWT({
    openId: "user@example.com",
    appId: "dragon-telegram-pro",
    name: "DragonUser",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("1y")
    .sign(secret);
  
  console.log(token);
}

generate().catch(console.error);
