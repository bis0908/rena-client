/**
 * 세션 스토리지 관리 유틸리티
 */
export const storageManager = {
  /**
   * 데이터를 세션 스토리지에 저장
   * @param {string} key - 스토리지 키
   * @param {*} value - 저장할 값
   */
  setItem: (key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * 세션 스토리지에서 데이터 가져오기
   * @param {string} key - 스토리지 키
   * @returns {Array<object>} - 저장된 객체 배열 또는 빈 배열
   */
  getItem: (key) => {
    return JSON.parse(sessionStorage.getItem(key)) || [];
  },

  /**
   * ID로 특정 항목 찾기
   * @param {string} key - 스토리지 키
   * @param {string} id - 찾을 항목의 ID
   * @returns {Object | null} - 찾은 객체 또는 null
   */
  getItemById: (key, id) => {
    const items = JSON.parse(sessionStorage.getItem(key)) || [];
    return items.find((item) => item.id === id);
  },

  /**
   * 특정 키의 데이터 제거
   * @param {string} key - 스토리지 키
   */
  removeItem: (key) => {
    sessionStorage.removeItem(key);
  },

  /**
   * 모든 세션 스토리지 데이터 제거
   */
  clear: () => {
    sessionStorage.clear();
  },
};

/**
 * 응용 프로그램 상태 백업 저장소
 */
export let stateBackup = {};
