namespace qMRI.Application.Authentication.Abstractions;

public interface IPasswordHashingService
{
    string HashPassword(string password);

    bool VerifyPassword(string password, string passwordHash);
}
