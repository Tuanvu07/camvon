import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy dữ liệu ảnh' }, { status: 400 });
    }

    // Tương lai: Gọi API thật của FPT.AI, Zalo AI, Google Cloud Vision
    // const response = await fetch('https://api.fpt.ai/vision/idr/vnm', {
    //   method: 'POST',
    //   headers: { 'api-key': process.env.OCR_API_KEY as string },
    //   body: formData
    // });
    
    // Giả lập hệ thống AI bóc tách mất 1.5 giây (Mô phỏng độ trễ mạng thực tế)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Dữ liệu bóc tách mẫu (Auto-fill Mock)
    return NextResponse.json({
      success: true,
      data: {
        name: "NGUYỄN VĂN LENDOS",
        cccd: "079099123456",
        dob: "01/01/1985",
        address: "Khu Công Nghệ Cao, TP.Thủ Đức, TP.HCM",
        phone: "" // CCCD không có SĐT, nhân viên phải tự nhập
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
