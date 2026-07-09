namespace qMRI.Application.Authentication.Abstractions;

public interface IRefreshTokenFactory
{
    string CreateToken();
}
