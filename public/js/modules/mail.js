import { STORAGE_KEYS, FLAG } from "../config/constants.js";
import { ENDPOINTS } from "../services/api.js";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONFIRM_MESSAGES,
} from "../config/messages.js";
import { storageManager } from "../utils/storage.js";
import {
  showLoading,
  hideLoading,
  showToast,
  isValidEmail,
} from "../utils/helpers.js";
import {
  getDate,
  isTimeWithinAllowedRange,
  calcTakeTime,
} from "../utils/date.js";
import { uiModule } from "./ui.js";

/**
 * 메일 발송 모듈
 */
export const mailModule = {
  // 상태
  state: {
    isReadyToSendMail: {},
    timeZone: null,
    transInfo: null,
  },

  /**
   * 초기화
   * @returns {void}
   */
  init() {
    this._setupEventListeners();
    this.getAllowedTimeZone();
  },

  /**
   * 이벤트 리스너 설정
   * @private
   */
  _setupEventListeners() {
    $("#sendMailBtn").on("click", this.preparingSendMail.bind(this, FLAG.YES));
    $("#testMailBtn").on("click", this.sendTestMail.bind(this));
    $("#sendAllTestBtn").on("click", this.sendTestAll.bind(this));
    $("#clearListBtn").on("click", this.sendListClear.bind(this));
    $("#addManuallyBtn").on("click", this.addManually.bind(this));
  },

  /**
   * 허용된 시간대 가져오기
   * @returns {Promise<void>}
   */
  async getAllowedTimeZone() {
    try {
      const response = await fetch(ENDPOINTS.TIME_ZONE);

      if (!response.ok) {
        throw new Error("Failed to fetch time zone");
      }

      const data = await response.json();
      this.state.timeZone = data;
    } catch (error) {
      console.error("Error fetching time zone:", error);
      showToast("허용된 시간대 정보를 가져오는 데 실패했습니다.", "danger");
    }
  },

  /**
   * 메일 발송 준비 상태 설정
   * @param {string} senderId - 발송자 ID
   * @param {string} mailNo - 메일 번호
   * @returns {Promise<void>}
   */
  async setReadyToSendMail(senderId, mailNo) {
    if (!senderId || !mailNo) return;

    if (!this.state.isReadyToSendMail[senderId]) {
      this.state.isReadyToSendMail[senderId] = [];
    }

    if (!this.state.isReadyToSendMail[senderId].includes(mailNo)) {
      this.state.isReadyToSendMail[senderId].push(mailNo);
    }
  },

  /**
   * 트랜잭션 정보 설정
   * @param {string} senderId - 발송자 ID
   * @returns {Promise<void>}
   */
  async getTransInfo(senderId) {
    if (!senderId) return null;

    try {
      const response = await fetch(
        `${ENDPOINTS.SEND_MAIL}/transInfo/${senderId}`
      );
      if (!response.ok)
        throw new Error("트랜잭션 정보를 가져오는데 실패했습니다.");

      const data = await response.json();
      this.state.transInfo = data;
      return data;
    } catch (error) {
      console.error("Error fetching transaction info:", error);
      return null;
    }
  },

  /**
   * 메일 발송 준비 상태 해제
   * @param {string} senderId - 발송자 ID
   * @param {string} mailNo - 메일 번호
   * @returns {Promise<void>}
   */
  async unsetReadyToSendMail(senderId, mailNo) {
    if (!senderId || !mailNo) return;

    if (this.state.isReadyToSendMail[senderId]) {
      this.state.isReadyToSendMail[senderId] = this.state.isReadyToSendMail[
        senderId
      ].filter((no) => no !== mailNo);

      if (this.state.isReadyToSendMail[senderId].length === 0) {
        delete this.state.isReadyToSendMail[senderId];
      }
    }
  },

  /**
   * 트랜잭션 정보 삭제
   * @param {string} senderId - 발송자 ID
   * @returns {Promise<void>}
   */
  async removeTransInfo(senderId) {
    if (!senderId) return;

    try {
      const response = await fetch(
        `${ENDPOINTS.SEND_MAIL}/transInfo/${senderId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("트랜잭션 정보 삭제에 실패했습니다.");

      this.state.transInfo = null;
    } catch (error) {
      console.error("Error removing transaction info:", error);
    }
  },

  /**
   * 메일 발송 준비 확인
   * @param {string} senderId - 발송자 ID
   * @param {string} mailNo - 메일 번호
   * @returns {boolean} - 준비 여부
   */
  async isReadyToSendMail(senderId, mailNo) {
    if (!senderId || !mailNo) return false;

    return (
      this.state.isReadyToSendMail[senderId] &&
      this.state.isReadyToSendMail[senderId].includes(mailNo)
    );
  },

  /**
   * 준비된 메일 목록 가져오기
   * @returns {Object} - 준비된 메일 목록
   */
  async getReadyToSendMailList() {
    return this.state.isReadyToSendMail;
  },

  /**
   * 트랜잭션 정보 목록 가져오기
   * @returns {Object} - 트랜잭션 정보 목록
   */
  async getTransInfoList() {
    try {
      const response = await fetch(`${ENDPOINTS.SEND_MAIL}/transInfo`);
      if (!response.ok)
        throw new Error("트랜잭션 정보 목록을 가져오는데 실패했습니다.");

      return await response.json();
    } catch (error) {
      console.error("Error fetching transaction info list:", error);
      return [];
    }
  },

  /**
   * 준비된 메일 목록 삭제
   * @param {Array} noList - 삭제할 번호 목록
   * @returns {Promise<void>}
   */
  async removeReadyToSendMailList(noList) {
    if (!noList || !Array.isArray(noList) || noList.length === 0) return;

    for (const senderId in this.state.isReadyToSendMail) {
      this.state.isReadyToSendMail[senderId] = this.state.isReadyToSendMail[
        senderId
      ].filter((mailNo) => !noList.includes(mailNo));

      if (this.state.isReadyToSendMail[senderId].length === 0) {
        delete this.state.isReadyToSendMail[senderId];
      }
    }
  },

  /**
   * 트랜잭션 정보 목록 삭제
   * @param {Array} noList - 삭제할 번호 목록
   * @returns {Promise<void>}
   */
  async removeTransInfoList(noList) {
    if (!noList || !Array.isArray(noList) || noList.length === 0) return;

    try {
      const response = await fetch(`${ENDPOINTS.SEND_MAIL}/transInfo`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noList }),
      });

      if (!response.ok)
        throw new Error("트랜잭션 정보 목록 삭제에 실패했습니다.");
    } catch (error) {
      console.error("Error removing transaction info list:", error);
    }
  },

  /**
   * 준비된 메일 목록 업데이트
   * @param {Array} noList - 업데이트할 번호 목록
   * @returns {Promise<void>}
   */
  async updateReadyToSendMailList(noList) {
    if (!noList || !Array.isArray(noList) || noList.length === 0) return;

    try {
      // 서버에서 최신 상태 가져와서 업데이트
      const response = await fetch(`${ENDPOINTS.SEND_MAIL}/ready`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noList }),
      });

      if (!response.ok)
        throw new Error("준비된 메일 목록 업데이트에 실패했습니다.");

      const data = await response.json();
      this.state.isReadyToSendMail = data;
    } catch (error) {
      console.error("Error updating ready to send mail list:", error);
    }
  },

  /**
   * 트랜잭션 정보 목록 업데이트
   * @param {Array} noList - 업데이트할 번호 목록
   * @returns {Promise<void>}
   */
  async updateTransInfoList(noList) {
    if (!noList || !Array.isArray(noList) || noList.length === 0) return;

    try {
      const response = await fetch(`${ENDPOINTS.SEND_MAIL}/transInfo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noList }),
      });

      if (!response.ok)
        throw new Error("트랜잭션 정보 목록 업데이트에 실패했습니다.");

      const data = await response.json();
      this.state.transInfo = data;
    } catch (error) {
      console.error("Error updating transaction info list:", error);
    }
  },

  /**
   * 준비된 메일 목록 필터링
   * @param {Object} filter - 필터 조건
   * @returns {Object} - 필터링된 목록
   */
  async filterReadyToSendMailList(filter) {
    if (!filter) return this.state.isReadyToSendMail;

    const filtered = {};

    for (const senderId in this.state.isReadyToSendMail) {
      if (filter.senderId && senderId !== filter.senderId) continue;

      filtered[senderId] = this.state.isReadyToSendMail[senderId].filter(
        (mailNo) => {
          // 추가 필터링 조건이 있다면 여기에 구현
          return true;
        }
      );
    }

    return filtered;
  },

  /**
   * 트랜잭션 정보 목록 필터링
   * @param {Object} filter - 필터 조건
   * @returns {Promise<Array>} - 필터링된 목록
   */
  async filterTransInfoList(filter) {
    try {
      const response = await fetch(`${ENDPOINTS.SEND_MAIL}/transInfo/filter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filter),
      });

      if (!response.ok)
        throw new Error("트랜잭션 정보 목록 필터링에 실패했습니다.");

      return await response.json();
    } catch (error) {
      console.error("Error filtering transaction info list:", error);
      return [];
    }
  },

  /**
   * 준비된 메일 목록 정렬
   * @param {Object} sort - 정렬 조건
   * @returns {Object} - 정렬된 목록
   */
  async sortReadyToSendMailList(sort) {
    if (!sort) return this.state.isReadyToSendMail;

    const sorted = {};

    for (const senderId in this.state.isReadyToSendMail) {
      sorted[senderId] = [...this.state.isReadyToSendMail[senderId]];

      // 기본 정렬은 번호 기준 오름차순
      sorted[senderId].sort((a, b) => {
        if (sort.direction === "desc") {
          return b - a;
        }
        return a - b;
      });
    }

    return sorted;
  },

  /**
   * 트랜잭션 정보 목록 정렬
   * @param {Object} sort - 정렬 조건
   * @returns {Promise<Array>} - 정렬된 목록
   */
  async sortTransInfoList(sort) {
    try {
      const response = await fetch(`${ENDPOINTS.SEND_MAIL}/transInfo/sort`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sort),
      });

      if (!response.ok)
        throw new Error("트랜잭션 정보 목록 정렬에 실패했습니다.");

      return await response.json();
    } catch (error) {
      console.error("Error sorting transaction info list:", error);
      return [];
    }
  },

  /**
   * 준비된 메일 목록 페이징 처리
   * @param {number} page - 페이지 번호
   * @param {number} pageSize - 페이지 크기
   * @returns {Object} - 페이징 처리된 목록
   */
  async getReadyToSendMailListPaged(page, pageSize) {
    const result = {};

    for (const senderId in this.state.isReadyToSendMail) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      result[senderId] = this.state.isReadyToSendMail[senderId].slice(
        start,
        end
      );
    }

    return {
      items: result,
      total: Object.values(this.state.isReadyToSendMail).reduce(
        (acc, curr) => acc + curr.length,
        0
      ),
      page,
      pageSize,
    };
  },

  /**
   * 트랜잭션 정보 목록 페이징 처리
   * @param {number} page - 페이지 번호
   * @param {number} pageSize - 페이지 크기
   * @returns {Promise<Object>} - 페이징 처리된 목록
   */
  async getTransInfoListPaged(page, pageSize) {
    try {
      const response = await fetch(
        `${ENDPOINTS.SEND_MAIL}/transInfo/page/${page}/${pageSize}`
      );

      if (!response.ok)
        throw new Error("트랜잭션 정보 목록 페이징 처리에 실패했습니다.");

      return await response.json();
    } catch (error) {
      console.error("Error getting paged transaction info list:", error);
      return { items: [], total: 0, page, pageSize };
    }
  },

  /**
   * 필터링된 준비된 메일 목록 페이징 처리
   * @param {Object} filter - 필터 조건
   * @param {number} page - 페이지 번호
   * @param {number} pageSize - 페이지 크기
   * @returns {Promise<Object>} - 페이징 처리된 목록
   */
  async filterAndGetReadyToSendMailListPaged(filter, page, pageSize) {
    const filtered = await this.filterReadyToSendMailList(filter);

    const result = {};
    let totalItems = 0;

    for (const senderId in filtered) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      result[senderId] = filtered[senderId].slice(start, end);
      totalItems += filtered[senderId].length;
    }

    return {
      items: result,
      total: totalItems,
      page,
      pageSize,
    };
  },

  /**
   * 필터링된 트랜잭션 정보 목록 페이징 처리
   * @param {Object} filter - 필터 조건
   * @param {number} page - 페이지 번호
   * @param {number} pageSize - 페이지 크기
   * @returns {Promise<Object>} - 페이징 처리된 목록
   */
  async filterAndGetTransInfoListPaged(filter, page, pageSize) {
    try {
      const response = await fetch(
        `${ENDPOINTS.SEND_MAIL}/transInfo/filter/page`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filter, page, pageSize }),
        }
      );

      if (!response.ok)
        throw new Error(
          "필터링된 트랜잭션 정보 목록 페이징 처리에 실패했습니다."
        );

      return await response.json();
    } catch (error) {
      console.error(
        "Error getting filtered paged transaction info list:",
        error
      );
      return { items: [], total: 0, page, pageSize };
    }
  },

  /**
   * 필터링 및 정렬된 준비된 메일 목록
   * @param {Object} filter - 필터 조건
   * @param {Object} sort - 정렬 조건
   * @returns {Promise<Object>} - 필터링 및 정렬된 목록
   */
  async filterAndSortReadyToSendMailList(filter, sort) {
    const filtered = await this.filterReadyToSendMailList(filter);

    const result = {};

    for (const senderId in filtered) {
      result[senderId] = [...filtered[senderId]];

      if (sort) {
        // 기본 정렬은 번호 기준 오름차순
        result[senderId].sort((a, b) => {
          if (sort.direction === "desc") {
            return b - a;
          }
          return a - b;
        });
      }
    }

    return result;
  },

  /**
   * 필터링 및 정렬된 트랜잭션 정보 목록
   * @param {Object} filter - 필터 조건
   * @param {Object} sort - 정렬 조건
   * @returns {Promise<Array>} - 필터링 및 정렬된 목록
   */
  async filterAndSortTransInfoList(filter, sort) {
    try {
      const response = await fetch(
        `${ENDPOINTS.SEND_MAIL}/transInfo/filter/sort`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filter, sort }),
        }
      );

      if (!response.ok)
        throw new Error(
          "필터링 및 정렬된 트랜잭션 정보 목록 처리에 실패했습니다."
        );

      return await response.json();
    } catch (error) {
      console.error(
        "Error getting filtered and sorted transaction info list:",
        error
      );
      return [];
    }
  },

  /**
   * 필터링, 정렬 및 페이징된 준비된 메일 목록
   * @param {Object} filter - 필터 조건
   * @param {Object} sort - 정렬 조건
   * @param {number} page - 페이지 번호
   * @param {number} pageSize - 페이지 크기
   * @returns {Promise<Object>} - 필터링, 정렬 및 페이징된 목록
   */
  async filterAndSortAndGetReadyToSendMailListPaged(
    filter,
    sort,
    page,
    pageSize
  ) {
    const filteredAndSorted = await this.filterAndSortReadyToSendMailList(
      filter,
      sort
    );

    const result = {};
    let totalItems = 0;

    for (const senderId in filteredAndSorted) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      result[senderId] = filteredAndSorted[senderId].slice(start, end);
      totalItems += filteredAndSorted[senderId].length;
    }

    return {
      items: result,
      total: totalItems,
      page,
      pageSize,
    };
  },

  /**
   * 필터링, 정렬 및 페이징된 트랜잭션 정보 목록
   * @param {Object} filter - 필터 조건
   * @param {Object} sort - 정렬 조건
   * @param {number} page - 페이지 번호
   * @param {number} pageSize - 페이지 크기
   * @returns {Promise<Object>} - 필터링, 정렬 및 페이징된 목록
   */
  async filterAndSortAndGetTransInfoListPaged(filter, sort, page, pageSize) {
    try {
      const response = await fetch(
        `${ENDPOINTS.SEND_MAIL}/transInfo/filter/sort/page`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filter, sort, page, pageSize }),
        }
      );

      if (!response.ok)
        throw new Error(
          "필터링, 정렬 및 페이징된 트랜잭션 정보 목록 처리에 실패했습니다."
        );

      return await response.json();
    } catch (error) {
      console.error(
        "Error getting filtered, sorted and paged transaction info list:",
        error
      );
      return { items: [], total: 0, page, pageSize };
    }
  },

  /**
   * 모든 테스트 메일 발송
   * @returns {Promise<void>}
   */
  async sendTestAll() {
    const senderEmailInfo = window.senderModule?.state.senderEmailInfo;
    if (!senderEmailInfo || Object.keys(senderEmailInfo).length === 0) {
      return showToast("발송자 이메일 정보가 없습니다.", "warning");
    }

    const searchResults = storageManager.getItem(STORAGE_KEYS.SEARCH_RESULTS);
    if (!searchResults || searchResults.length === 0) {
      return showToast("검색 결과가 없습니다.", "warning");
    }

    const senderName = window.senderModule?.state.selectedSenderName;
    if (!senderName) {
      return showToast("발송자를 선택해주세요.", "warning");
    }

    try {
      showLoading();
      let index = 0;

      for (const email of Object.keys(senderEmailInfo)) {
        // 각 이메일마다 첫 번째 검색 결과 ID로 테스트 메일 발송
        const testId = searchResults[0].id;

        uiModule.changeSpinnerState(index, "loading");

        try {
          await this.sendTestMail(email, testId, senderName, index);
        } catch (error) {
          uiModule.changeSpinnerState(index, "failure");
          console.error(`Error sending test mail to ${email}:`, error);
        }

        index++;
      }

      showToast("모든 테스트 메일 발송이 완료되었습니다.", "success");
    } catch (error) {
      console.error("Error sending all test mails:", error);
      showToast("테스트 메일 발송 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 단일 테스트 메일 발송
   * @param {string} email - 테스트 이메일
   * @param {string} testId - 테스트 ID
   * @param {string} senderName - 발송자 이름
   * @param {number} index - 인덱스 (UI 업데이트용)
   * @returns {Promise<void>}
   */
  async sendTestMail(email, testId, senderName, index) {
    if (!email) {
      email = $("#testEmail").val().trim();
      if (!email) {
        return showToast("테스트 이메일을 입력해주세요.", "warning");
      }

      if (!isValidEmail(email)) {
        return showToast("유효한 이메일 주소를 입력해주세요.", "warning");
      }
    }

    if (!testId) {
      const searchResults = storageManager.getItem(STORAGE_KEYS.SEARCH_RESULTS);
      if (!searchResults || searchResults.length === 0) {
        return showToast("검색 결과가 없습니다.", "warning");
      }
      testId = searchResults[0].id;
    }

    if (!senderName) {
      senderName = window.senderModule?.state.selectedSenderName;
      if (!senderName) {
        return showToast("발송자를 선택해주세요.", "warning");
      }
    }

    try {
      showLoading();

      if (index !== undefined) {
        uiModule.changeSpinnerState(index, "loading");
      }

      const senderId = window.senderModule?.state.selectedSenderId;
      const subject = $("#subjectInput").val().trim();
      const contents = window.quill ? window.quill.root.innerHTML : "";

      if (!subject) {
        return showToast("이메일 제목을 입력해주세요.", "warning");
      }

      if (!contents) {
        return showToast("이메일 내용을 입력해주세요.", "warning");
      }

      const response = await fetch(ENDPOINTS.SEND_TEST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          testId,
          senderId,
          senderName,
          subject,
          contents,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send test mail");
      }

      if (index !== undefined) {
        uiModule.changeSpinnerState(index, "success");
      }

      showToast(`테스트 메일이 ${email}로 발송되었습니다.`, "success");
    } catch (error) {
      console.error("Error sending test mail:", error);

      if (index !== undefined) {
        uiModule.changeSpinnerState(index, "failure");
      }

      showToast("테스트 메일 발송 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 메일 발송 준비
   * @param {string} yesOrNo - 발송 여부 (Y/N)
   * @returns {Promise<void>}
   */
  async preparingSendMail(yesOrNo) {
    const senderId = window.senderModule?.state.selectedSenderId;
    const senderName = window.senderModule?.state.selectedSenderName;
    const senderGroup = $("#senderGroup").val();
    const subject = $("#subjectInput").val().trim();
    const innerHTML = window.quill ? window.quill.root.innerHTML : "";

    // 필수 정보 체크
    const emptyResource = [];
    if (!senderId || !senderName) emptyResource.push("- 발송자");
    if (!subject) emptyResource.push("- 이메일 제목");
    if (!innerHTML) emptyResource.push("- 이메일 내용");

    // 발송 대상 ID 목록 체크
    const searchResults = storageManager.getItem(STORAGE_KEYS.SEARCH_RESULTS);
    if (!searchResults || searchResults.length === 0) {
      emptyResource.push("- 발송 대상 ID");
    }

    // 발송자 이메일 체크
    const senderEmailInfo = window.senderModule?.state.senderEmailInfo;
    if (!senderEmailInfo || Object.keys(senderEmailInfo).length === 0) {
      emptyResource.push("- 발송자 이메일");
    }

    if (emptyResource.length > 0) {
      return this.checkInfoForSendMail(emptyResource.join("\n"));
    }

    // 허용된 시간 범위 체크
    const now = new Date();
    if (
      this.state.timeZone &&
      !isTimeWithinAllowedRange(now, this.state.timeZone)
    ) {
      const { startTime, endTime } = this.state.timeZone;
      return showToast(
        `허용된 발송 시간은 ${startTime} ~ ${endTime} 입니다.`,
        "warning"
      );
    }

    if (yesOrNo === FLAG.YES) {
      // 발송 확인
      const confirmed = confirm(CONFIRM_MESSAGES.SEND_MAIL);
      if (!confirmed) return;

      // 트랜잭션 정보 설정
      const transInfo = {
        senderId,
        senderName,
        senderGroup,
        subject,
        innerHTML,
        idListBackup: searchResults,
        sentIdBackup: storageManager.getItem(STORAGE_KEYS.EXIST_ID_LISTS),
        senderEmailInfo,
        timestamp: getDate(),
      };

      try {
        showLoading();

        // DB에 메일 발송 등록
        await this.dbMailSendingReg(transInfo);

        // 발송 목록 초기화
        storageManager.setItem(STORAGE_KEYS.SEARCH_RESULTS, []);
        storageManager.setItem(STORAGE_KEYS.EXIST_ID_LISTS, []);

        uiModule.updateSearchResult(
          STORAGE_KEYS.SEARCH_RESULTS,
          0,
          "#searchResult"
        );
        uiModule.updateSearchResult(
          STORAGE_KEYS.EXIST_ID_LISTS,
          1,
          "#sentIdList"
        );

        showToast("메일 발송이 시작되었습니다.", "success");
      } catch (error) {
        console.error("Error preparing send mail:", error);
        showToast("메일 발송 준비 중 오류가 발생했습니다.", "danger");
      } finally {
        hideLoading();
      }
    }
  },

  /**
   * 메일 발송 정보 DB 등록
   * @param {Object} transInfo - 트랜잭션 정보
   * @returns {Promise<void>}
   */
  async dbMailSendingReg(transInfo) {
    try {
      const response = await fetch(ENDPOINTS.SEND_MAIL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transInfo),
      });

      if (!response.ok) {
        throw new Error("Failed to register mail sending");
      }

      const result = await response.json();
      console.log("Mail sending registered:", result);
    } catch (error) {
      console.error("Error registering mail sending:", error);
      throw error;
    }
  },

  /**
   * 발송 리스트 초기화
   * @returns {Promise<void>}
   */
  async sendListClear() {
    const confirmed = confirm(CONFIRM_MESSAGES.CLEAR_LIST);
    if (!confirmed) return;

    storageManager.setItem(STORAGE_KEYS.SEARCH_RESULTS, []);
    storageManager.setItem(STORAGE_KEYS.EXIST_ID_LISTS, []);

    uiModule.updateSearchResult(
      STORAGE_KEYS.SEARCH_RESULTS,
      0,
      "#searchResult"
    );
    uiModule.updateSearchResult(STORAGE_KEYS.EXIST_ID_LISTS, 1, "#sentIdList");

    showToast("발송 리스트가 초기화되었습니다.", "success");
  },

  /**
   * ID 수동 추가
   * @returns {Promise<void>}
   */
  async addManually() {
    const manualId = $("#manualID").val().trim();
    const keyword = $("#manualKeyword").val().trim();
    const link = $("#manualLink").val().trim();
    const title = $("#manualTitle").val().trim();

    if (!manualId) {
      return showToast("ID를 입력해주세요.", "warning");
    }

    const searchResults = storageManager.getItem(STORAGE_KEYS.SEARCH_RESULTS);
    const existingItem = searchResults.find((item) => item.id === manualId);

    if (existingItem) {
      return showToast("이미 목록에 존재하는 ID입니다.", "warning");
    }

    const newItem = {
      id: manualId,
      keyword: keyword || "",
      link: link || "",
      title: title || "",
      isManual: true,
    };

    searchResults.push(newItem);
    storageManager.setItem(STORAGE_KEYS.SEARCH_RESULTS, searchResults);

    uiModule.updateSearchResult(
      STORAGE_KEYS.SEARCH_RESULTS,
      0,
      "#searchResult"
    );

    // 입력 필드 초기화
    $("#manualID").val("");
    $("#manualKeyword").val("");
    $("#manualLink").val("");
    $("#manualTitle").val("");

    showToast("ID가 수동으로 추가되었습니다.", "success");
  },

  /**
   * 발송 정보 확인
   * @param {string} emptyResource - 부족한 정보 목록
   * @returns {Promise<void>}
   */
  checkInfoForSendMail(emptyResource) {
    console.log("isReadyToSendMail: ", this.state.isReadyToSendMail);
    console.log("transInfo: ", this.state.transInfo);
    return showToast(
      `발송에 필요한 아래 정보를 확인하십시오\n${emptyResource}`,
      "warning"
    );
  },

  /**
   * 블랙리스트에 ID 추가
   * @param {string} id - 추가할 ID
   * @param {string} date - 날짜
   * @returns {Promise<void>}
   */
  async addBlackListFromDB(id, date) {
    if (!id) {
      return showToast("블랙리스트에 추가할 ID를 입력해주세요.", "warning");
    }

    try {
      showLoading();
      const response = await fetch(ENDPOINTS.BLACKLIST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          date: date || getDate(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to blacklist");
      }

      showToast(`ID '${id}'가 블랙리스트에 추가되었습니다.`, "success");
    } catch (error) {
      console.error("Error adding to blacklist:", error);
      showToast("블랙리스트 추가 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },
};
