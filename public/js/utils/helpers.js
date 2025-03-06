/**
 * 지정된 시간만큼 지연
 * @param {number} interval - 지연 시간(밀리초)
 * @returns {Promise<void>}
 */
export async function delay(interval) {
  return new Promise((resolve) => setTimeout(resolve, interval));
}

/**
 * 두 배열의 중복되지 않는 값들을 병합
 * @param {Array} arr1 - 첫 번째 배열
 * @param {Array} arr2 - 두 번째 배열
 * @returns {Array} - 중복이 제거된 병합 배열
 */
export function mergeAndResolve(arr1, arr2) {
  const result = [...arr1];

  arr2.forEach((item) => {
    if (!result.some((existingItem) => existingItem.id === item.id)) {
      result.push(item);
    }
  });

  return result;
}

/**
 * 이메일 유효성 검사
 * @param {string} email - 검사할 이메일 주소
 * @returns {boolean} - 유효성 여부
 */
export function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

/**
 * ID 유효성 검사
 * @param {string} id - 검사할 ID
 * @returns {boolean} - 유효성 여부
 */
export function isValidID(id) {
  return /^[a-zA-Z0-9_-]{4,20}$/.test(id);
}

/**
 * 배열 내 특정 ID 존재 여부 확인
 * @param {Array} targetArray - 대상 배열
 * @param {Array} compareArray - 비교 배열
 * @returns {Array} - 중복되지 않는 항목 배열
 */
export function isExistId(targetArray, compareArray) {
  return targetArray.filter(
    (item) => !compareArray.some((cItem) => cItem.id === item.id)
  );
}

/**
 * 요소 표시/숨김 토글
 * @param {jQuery|string} showTag - 표시할 요소
 * @param {...(jQuery|string)} hideTag - 숨길 요소들
 */
export function hideAndSeek(showTag, ...hideTag) {
  $(showTag).show();
  hideTag.forEach((tag) => $(tag).hide());
}

/**
 * 로딩 인디케이터 표시
 */
export function showLoading() {
  $("#loading").show();
  $("#progressContainer").css("display", "flex");
  $("#progress").css("width", "0%");
}

/**
 * 진행 표시줄 업데이트
 * @param {number} percentage - 진행률 (0-100)
 */
export function updateProgressBar(percentage) {
  $("#progress").css("width", percentage + "%");
}

/**
 * 로딩 인디케이터 숨김
 */
export function hideLoading() {
  $("#loading").hide();
  $("#progressContainer").hide();
}

/**
 * 토스트 메시지 표시
 * @param {string} content - 표시할 메시지
 * @param {string} colorClass - 색상 클래스 (primary, success, danger 등)
 * @returns {Promise<void>} - 토스트가 사라진 후 해결되는 Promise
 */
export function showToast(content, colorClass = "primary") {
  const toast = $("#toast");
  toast
    .removeClass()
    .addClass(`toast align-items-center border-0 text-bg-${colorClass}`);
  $(".toast-body").text(content);

  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();

  return new Promise((resolve) => {
    toast.on("hidden.bs.toast", () => {
      resolve();
    });
  });
}

/**
 * 상태 전환 스위치 - 끄기
 * @param {jQuery|string} target - 대상 요소
 */
export function switchOff(target) {
  $(target).prop("checked", false).change();
}

/**
 * 상태 전환 스위치 - 켜기
 * @param {jQuery|string} target - 대상 요소
 */
export function switchOn(target) {
  $(target).prop("checked", true).change();
}
