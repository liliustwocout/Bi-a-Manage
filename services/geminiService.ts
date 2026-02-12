
import { GoogleGenAI } from "@google/genai";

// Fix: Initialize GoogleGenAI using the environment variable API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBusinessInsights = async (stats: any) => {
  try {
    // Fix: Using gemini-3-pro-preview for complex reasoning task (business analysis)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Phân tích hiệu quả kinh doanh của câu lạc bộ Billiards dựa trên dữ liệu sau:
      Doanh thu hôm nay: 2.850.000 VNĐ.
      Số bàn đang hoạt động: 8/16.
      Giờ cao điểm đang bắt đầu.
      Dịch vụ F&B chiếm 40% doanh thu.
      Hãy đưa ra 3 lời khuyên ngắn gọn để tối ưu hóa lợi nhuận tối nay.`
    });
    // Fix: Access response.text directly (property, not method)
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Không thể tải phân tích thông minh vào lúc này. Vui lòng thử lại sau.";
  }
};
