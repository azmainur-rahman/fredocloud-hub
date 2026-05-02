import jwt from "jsonwebtoken";

const accessCookieName = "accessToken";
const refreshCookieName = "refreshToken";

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge,
});

const getJwtSecrets = () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
  const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";

  return { accessSecret, refreshSecret };
};

export const generateToken = (res, userId) => {
  const { accessSecret, refreshSecret } = getJwtSecrets();

  const accessToken = jwt.sign({ userId }, accessSecret, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, refreshSecret, {
    expiresIn: "7d",
  });

  res.cookie(accessCookieName, accessToken, getCookieOptions(15 * 60 * 1000));
  res.cookie(
    refreshCookieName,
    refreshToken,
    getCookieOptions(7 * 24 * 60 * 60 * 1000),
  );

  return { accessToken, refreshToken };
};

export const clearAuthCookies = (res) => {
  res.cookie(accessCookieName, "", getCookieOptions(0));
  res.cookie(refreshCookieName, "", getCookieOptions(0));
};
