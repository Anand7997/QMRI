const DEFAULT_BLOCKED_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "ymail.com",
  "rocketmail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "aol.com",
  "gmx.com",
  "gmx.de",
  "mail.com",
  "yandex.com",
  "mail.ru",
  "fastmail.com",
  "tutanota.com",
  "tuta.io",
  "hushmail.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "throwawaymail.com",
  "yopmail.com",
  "getnada.com",
  "sharklasers.com",
  "dispostable.com",
  "trashmail.com",
  "fakeinbox.com",
  "maildrop.cc",
  "emailondeck.com",
  "mohmal.com",
  "temp-mail.org",
  "tempail.com",
  "mailnesia.com",
  "mintemail.com",
  "spamgourmet.com",
  "discard.email",
  "inboxkitten.com",
] as const;

const configuredBlockedDomains = (import.meta.env.VITE_BUSINESS_EMAIL_BLOCKED_DOMAINS ?? "")
  .split(",")
  .map((domain: string) => domain.trim().toLowerCase())
  .filter(Boolean);

const blockedDomains = new Set(
  configuredBlockedDomains.length > 0 ? configuredBlockedDomains : DEFAULT_BLOCKED_DOMAINS,
);

export function getBusinessEmailValidationMessage(value: string): string | null {
  if (!value) {
    return "Work email is required.";
  }

  if (value.length > 256 || /\s/.test(value)) {
    return "Enter a valid business email address without spaces.";
  }

  const atIndex = value.indexOf("@");
  if (atIndex <= 0 || atIndex !== value.lastIndexOf("@") || atIndex === value.length - 1) {
    return "Enter a valid business email address.";
  }

  const localPart = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1).toLowerCase();
  const topLevelDomain = domain.slice(domain.lastIndexOf(".") + 1);
  const localPartPattern = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  const domainPattern = /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

  if (
    localPart.length > 64
    || localPart.startsWith(".")
    || localPart.endsWith(".")
    || localPart.includes("..")
    || !localPartPattern.test(localPart)
    || domain.length > 253
    || !domainPattern.test(domain)
    || topLevelDomain.length < 2
  ) {
    return "Enter a valid business email address.";
  }

  if ([...blockedDomains].some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))) {
    return "Please use a company or organizational email address.";
  }

  return null;
}

export function isBusinessEmail(value: string): boolean {
  return getBusinessEmailValidationMessage(value) === null;
}
