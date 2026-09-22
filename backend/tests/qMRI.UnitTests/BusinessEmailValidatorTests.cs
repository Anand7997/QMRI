using Microsoft.Extensions.Options;
using qMRI.Infrastructure.Authentication.Options;
using qMRI.Infrastructure.Authentication.Services;

namespace qMRI.UnitTests;

public sealed class BusinessEmailValidatorTests
{
    private readonly BusinessEmailValidator _validator = new(
        Options.Create(new BusinessEmailOptions
        {
            BlockedDomains = BusinessEmailOptions.DefaultBlockedDomains
        }));

    [Theory]
    [InlineData("vanand@quinnox.com")]
    [InlineData("employee@company.com")]
    [InlineData("person@research.company.co.uk")]
    public void Accepts_valid_organizational_emails(string email)
    {
        Assert.True(_validator.IsValid(email));
    }

    [Theory]
    [InlineData("user@gmail.com")]
    [InlineData("user@tempmail.com")]
    [InlineData("user@invalid")]
    [InlineData("user @company.com")]
    [InlineData("user@company..com")]
    [InlineData("user@-company.com")]
    public void Rejects_personal_disposable_and_malformed_emails(string email)
    {
        Assert.False(_validator.IsValid(email));
    }

    [Fact]
    public void Uses_configured_blocked_domains_without_an_allowlist()
    {
        var validator = new BusinessEmailValidator(
            Options.Create(new BusinessEmailOptions { BlockedDomains = ["blocked.example"] }));

        Assert.False(validator.IsValid("person@blocked.example"));
        Assert.True(validator.IsValid("person@any-company.example"));
    }
}
