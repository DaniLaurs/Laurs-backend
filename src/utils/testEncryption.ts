
import "dotenv/config";
import { encryptToken, decryptToken } from "./encryption";

const originalToken = "token-ficticio-para-teste-123";

const encrypted = encryptToken(originalToken);
const decrypted = decryptToken(encrypted);

console.log("Token criptografado:", encrypted !== originalToken);
console.log("Token recuperado corretamente:", decrypted === originalToken);
