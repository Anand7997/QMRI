namespace qMRI.Infrastructure.Authentication.Options;

public sealed class BusinessEmailOptions
{
    public const string SectionName = "BusinessEmail";

    public string[] BlockedDomains { get; set; } = DefaultBlockedDomains;

    public static readonly string[] DefaultBlockedDomains =
    [
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
        "inboxkitten.com"
    ];
}
