export function getVNTodayBoundary() {
  const now = new Date();
  
  // Lấy ngày hiện tại theo chuẩn múi giờ Việt Nam (UTC+7)
  const vnTimeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  // Định dạng của en-US là MM/DD/YYYY
  const [month, day, year] = vnTimeStr.split('/');
  
  // Chuyển đổi về UTC chuẩn để query Database chính xác
  // 00:00:00 ở VN -> -7 tiếng ở UTC (17:00:00 ngày hôm trước)
  const startOfDay = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), -7, 0, 0, 0));
  
  // 23:59:59 ở VN -> 16:59:59 ở UTC
  const endOfDay = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 16, 59, 59, 999));
  
  return { startOfDay, endOfDay };
}

export function formatVNDate(dateInput: Date | string) {
  if (!dateInput) return '--';
  const date = new Date(dateInput);
  
  // Ép hiển thị ra chuẩn múi giờ VN
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}
