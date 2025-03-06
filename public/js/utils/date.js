/**
 * 날짜 문자열을 형식화된 문자열로 변환
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} - 형식화된 날짜 문자열
 */
export function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  return new Date(dateString)
    .toLocaleString("ko-KR", options)
    .replace(/\. /g, "-")
    .replace(/\./g, "")
    .replace(/ /g, " ");
}

/**
 * 현재 날짜 및 시간 가져오기
 * @returns {string} - 현재 날짜 및 시간
 */
export function getDate() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

/**
 * 입력 필드에 적합한 형식의 현재 날짜/시간 가져오기
 * @returns {string} - 형식화된 날짜/시간 문자열
 */
export function getCurrentDateTimeForInput() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * 시간 필터 조건에 현재 시간 설정
 */
export function setTimeTodayInFilter() {
  const now = getCurrentDateTimeForInput();
  $("#timeSearchStart").val(now.slice(0, 10) + "T00:00");
  $("#timeSearchEnd").val(now);
}

/**
 * 소요 시간 계산 (초 -> 시:분:초 형식)
 * @param {number} timeInSeconds - 초 단위 시간
 * @returns {string} - 형식화된 시간 문자열
 */
export function calcTakeTime(timeInSeconds) {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

/**
 * 주어진 시간이 허용된 시간 범위 내인지 확인
 * @param {Date} time - 확인할 시간
 * @param {Object} allowedTimeRange - 허용된 시간 범위
 * @returns {boolean} - 범위 내 여부
 */
export function isTimeWithinAllowedRange(time, allowedTimeRange) {
  const hour = time.getHours();
  const minute = time.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  const startHour = parseInt(allowedTimeRange.startTime.split(":")[0]);
  const startMinute = parseInt(allowedTimeRange.startTime.split(":")[1]);
  const startInMinutes = startHour * 60 + startMinute;

  const endHour = parseInt(allowedTimeRange.endTime.split(":")[0]);
  const endMinute = parseInt(allowedTimeRange.endTime.split(":")[1]);
  const endInMinutes = endHour * 60 + endMinute;

  return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
}
