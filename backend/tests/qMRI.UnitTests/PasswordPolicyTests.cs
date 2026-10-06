using qMRI.Application.Authentication;

namespace qMRI.UnitTests;

public sealed class PasswordPolicyTests
{
    [Theory]
    [InlineData("short")]
    [InlineData("lowercase1!")]
    [InlineData("UPPERCASE1!")]
    [InlineData("ValidPassword!")]
    [InlineData("ValidPassword1")]
    public void Rejects_passwords_missing_a_strength_requirement(string password)
    {
        Assert.NotNull(PasswordPolicy.GetValidationError(password));
    }

    [Theory]
    [InlineData("StrongPass1!")]
    [InlineData("Another9#Password")]
    public void Accepts_passwords_meeting_all_strength_requirements(string password)
    {
        Assert.Null(PasswordPolicy.GetValidationError(password));
    }
}
