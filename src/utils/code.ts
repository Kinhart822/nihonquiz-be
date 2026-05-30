export const OTP_LENGTH = 6;
export const generateOTP = (): string => {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
};

export const isOtpValid = (expireAt: Date) => {
  if (expireAt.getTime() < Date.now()) return false;
  return true;
};
