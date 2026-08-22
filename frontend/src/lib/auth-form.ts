const NAME_PATTERN = /^[A-Za-zА-Яа-яЁёӨөҮүҢңІі'’.\- ]+$/;
const HAS_LETTER = /[A-Za-zА-Яа-яЁёӨөҮүҢңІі]/;
const SPECIAL = /[^A-Za-z0-9]/;
const WEAK_PASSWORDS = new Set([
  "12345678",
  "password",
  "password1",
  "qwerty123",
  "qwerty",
  "11111111",
  "abcdefgh",
  "letmein1",
  "admin123",
  "passw0rd",
]);
const SEQUENCES = [
  "0123456789",
  "9876543210",
  "abcdefghijklmnopqrstuvwxyz",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
];

export function isPersonName(value: string): boolean {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (cleaned.length < 2) {
    return false;
  }
  if (/^[\d\s]+$/.test(cleaned) || !HAS_LETTER.test(cleaned)) {
    return false;
  }
  return NAME_PATTERN.test(cleaned);
}

export function isStrongPassword(password: string, email?: string): boolean {
  if (password.length < 8) {
    return false;
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !SPECIAL.test(password)) {
    return false;
  }
  const lowered = password.toLowerCase();
  if (WEAK_PASSWORDS.has(lowered) || /^\d+$/.test(password) || /^[a-zA-Z]+$/.test(password)) {
    return false;
  }
  for (const sequence of SEQUENCES) {
    for (let index = 0; index <= sequence.length - 4; index += 1) {
      const chunk = sequence.slice(index, index + 4);
      if (lowered.includes(chunk) || lowered.includes([...chunk].reverse().join(""))) {
        return false;
      }
    }
  }
  if (email) {
    const local = email.split("@", 1)[0].toLowerCase();
    if (local.length >= 3 && lowered.includes(local)) {
      return false;
    }
  }
  return true;
}

export function formatKgPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("996")) {
    local = local.slice(3);
  }
  if (local.startsWith("0")) {
    local = local.slice(1);
  }
  local = local.slice(0, 9);
  const partA = local.slice(0, 3);
  const partB = local.slice(3, 6);
  const partC = local.slice(6, 9);
  if (!partA) {
    return "+996 ";
  }
  if (!partB) {
    return `+996 ${partA}`;
  }
  if (!partC) {
    return `+996 ${partA} ${partB}`;
  }
  return `+996 ${partA} ${partB} ${partC}`;
}

export function phoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("996")) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 9);
}

export function isKgPhone(value: string): boolean {
  return phoneDigits(value).length === 9;
}
