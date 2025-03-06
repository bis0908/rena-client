import { ENDPOINTS } from "../services/api.js";
import { showLoading, hideLoading, showToast } from "../utils/helpers.js";
import { uiModule } from "./ui.js";

/**
 * 키워드 관리 모듈
 */
export const keywordModule = {
  // 상태
  state: {
    keywords: [],
    selectedKeyword: null,
  },

  /**
   * 초기화
   * @returns {void}
   */
  init() {
    this._setupEventListeners();
  },

  /**
   * 이벤트 리스너 설정
   * @private
   */
  _setupEventListeners() {
    $("#addKeywordBtn").on("click", this.insertKeyWord.bind(this));
    $(document).on(
      "click",
      ".btn-remove-keyword",
      this._handleRemoveKeyword.bind(this)
    );
  },

  /**
   * 키워드 제거 핸들러
   * @private
   * @param {Event} e - 이벤트 객체
   */
  _handleRemoveKeyword(e) {
    const no = $(e.currentTarget).data("no");
    this.deleteKeyWord(no);
  },

  /**
   * 발송자별 키워드 목록 가져오기
   * @param {string} senderId - 발송자 ID
   * @returns {Promise<void>}
   */
  async getKeyWordList(senderId) {
    if (!senderId) {
      return;
    }

    try {
      const response = await fetch(`${ENDPOINTS.KEYWORDS}/${senderId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch keywords");
      }

      const data = await response.json();
      this.state.keywords = data;

      // 키워드 선택 드롭다운 업데이트
      const $keywordSelect = $("#keywordSelect");
      $keywordSelect.empty();
      $keywordSelect.append('<option value="">키워드 선택</option>');

      data.forEach((item) => {
        $keywordSelect.append(
          `<option value="${item.keyword}">${item.keyword}</option>`
        );
      });

      // 키워드 목록 UI 업데이트
      uiModule.generateKeyWordListItems(data);
    } catch (error) {
      console.error("Error fetching keywords:", error);
      showToast("키워드 목록을 가져오는 데 실패했습니다.", "danger");
    }
  },

  /**
   * 키워드 추가
   * @returns {Promise<void>}
   */
  async insertKeyWord() {
    const keyword = $("#keywordInput").val().trim();
    const senderId = window.senderModule?.state.selectedSenderId;

    if (!keyword) {
      return showToast("키워드를 입력해주세요.", "warning");
    }

    if (!senderId) {
      return showToast("발송자를 먼저 선택해주세요.", "warning");
    }

    // 중복 확인
    const isDuplicate = this.state.keywords.some(
      (item) => item.keyword === keyword
    );
    if (isDuplicate) {
      return showToast("이미 등록된 키워드입니다.", "warning");
    }

    try {
      showLoading();
      const response = await fetch(ENDPOINTS.ADD_KEYWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
          senderId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add keyword");
      }

      $("#keywordInput").val("");
      await this.getKeyWordList(senderId);
      showToast("키워드가 추가되었습니다.", "success");
    } catch (error) {
      console.error("Error adding keyword:", error);
      showToast("키워드 추가 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 키워드 삭제
   * @param {string} no - 키워드 번호
   * @returns {Promise<void>}
   */
  async deleteKeyWord(no) {
    const senderId = window.senderModule?.state.selectedSenderId;

    if (!no) {
      return showToast("삭제할 키워드를 선택해주세요.", "warning");
    }

    try {
      showLoading();
      const response = await fetch(`${ENDPOINTS.DELETE_KEYWORD}/${no}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete keyword");
      }

      await this.getKeyWordList(senderId);
      showToast("키워드가 삭제되었습니다.", "success");
    } catch (error) {
      console.error("Error deleting keyword:", error);
      showToast("키워드 삭제 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 여러 키워드 삭제
   * @param {Array} noList - 키워드 번호 목록
   * @returns {Promise<void>}
   */
  async deleteKeyWordList(noList) {
    const senderId = window.senderModule?.state.selectedSenderId;

    if (!noList || noList.length === 0) {
      return showToast("삭제할 키워드를 선택해주세요.", "warning");
    }

    const confirmed = confirm(
      `선택한 ${noList.length}개의 키워드를 삭제하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      showLoading();
      const response = await fetch(ENDPOINTS.DELETE_KEYWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noList }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete keywords");
      }

      await this.getKeyWordList(senderId);
      showToast(`${noList.length}개의 키워드가 삭제되었습니다.`, "success");
    } catch (error) {
      console.error("Error deleting keywords:", error);
      showToast("키워드 삭제 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 키워드 선택
   * @returns {Promise<void>}
   */
  async chooseKeyWord() {
    const $keywordList = $("#keywordList");
    const selectedKeyword = $keywordList.val();

    if (!selectedKeyword) {
      return showToast("키워드를 선택해주세요.", "warning");
    }

    const keywordItem = this.state.keywords.find(
      (item) => item.no === selectedKeyword
    );
    if (keywordItem) {
      this.state.selectedKeyword = keywordItem.keyword;
      $("#keywordInput").val(keywordItem.keyword);
      showToast(
        `키워드 '${keywordItem.keyword}'이(가) 선택되었습니다.`,
        "success"
      );
    }
  },
};
