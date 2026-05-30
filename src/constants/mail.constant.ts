export enum IMailCode {
  TC01 = 'TC-01',
  TC02 = 'TC-02',
  TC03 = 'TC-03',
}

export enum IMailType {
  SIGN_UP = 'SIGN_UP',
  RESEND_EMAIL = 'RESEND_EMAIL',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
}

export const MAIL_TITLE = {
  TC01: 'Your Email Verification Code',
  TC02: 'Your Verification Resend Email Code',
  TC03: 'Your Verification Forgot Password Code',
};

export const MAIL_BODY = {
  TC01:
    '<p>Hi %s,</p>' +
    '<p>For your security, please use the code below to complete your action:<br>%s<br>This code will expire in 5 minutes.</p>' +
    '<p>Thanks for using MoriPract.<br>—— The MoriPract Team</p>',
  TC02:
    '<p>Hi %s,</p>' +
    '<p>For your security, please use the code below to complete your action:<br>%s<br>This code will expire in 5 minutes.</p>' +
    '<p>Thanks for using MoriPract.<br>—— The MoriPract Team</p>',
  TC03:
    '<p>Hi %s,</p>' +
    '<p>For your security, please use the code below to complete your action:<br>%s<br>This code will expire in 5 minutes.</p>' +
    '<p>Thanks for using MoriPract.<br>—— The MoriPract Team</p>',
};
