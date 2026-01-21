
export const sendZNSOtp = async (
  phone: string, 
  otp: string, 
  config: { accessToken: string; templateId: string }
): Promise<boolean> => {
  if (!config.accessToken || !config.templateId) {
    console.warn("Zalo API chưa được cấu hình. Đang chạy chế độ demo (OTP: " + otp + ")");
    return true; // Trả về true để demo nếu chưa có key
  }

  try {
    // Chuẩn hóa số điện thoại sang định dạng 84xxx
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '84' + formattedPhone.substring(1);
    }

    const response = await fetch('https://openapi.zalo.me/v2.0/oa/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': config.accessToken
      },
      body: JSON.stringify({
        recipient: {
          phone: formattedPhone
        },
        template_id: config.templateId,
        template_data: {
          otp: otp
        }
      })
    });

    const result = await response.json();
    if (result.error !== 0) {
      console.error("Zalo API Error:", result.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("ZNS Error:", error);
    return false;
  }
};
