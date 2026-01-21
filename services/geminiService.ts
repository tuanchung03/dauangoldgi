
export const removeBackgroundAI = async (base64Image: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    console.error("Thiếu Remove.bg API Key.");
    throw new Error("API Key is required");
  }

  try {
    // Chuyển đổi base64 sang Blob để gửi qua FormData
    const base64Data = base64Image.split(',')[1] || base64Image;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('image_file', blob);
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Remove.bg API Error:", errorData);
      throw new Error(errorData.errors?.[0]?.title || "Lỗi khi tách nền");
    }

    const resultBlob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resultBlob);
    });
  } catch (error) {
    console.error("RemoveBackground Error:", error);
    throw error;
  }
};

export const generatePostcard = async (
  personImg: string, 
  sketchImg: string, 
  landmarkName: string,
  isChặng2: boolean,
  checkinImg?: string
): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return personImg; 
};
