import { STORAGE_KEYS } from "../config/constants.js";
import { ENDPOINTS } from "../services/api.js";
import { storageManager } from "../utils/storage.js";
import {
  showLoading,
  hideLoading,
  showToast,
  isExistId,
} from "../utils/helpers.js";
import { uiModule } from "./ui.js";

/**
 * 검색 모듈
 */
export const searchModule = {
  // 상태
  state: {
    selectedKeywords: [],
    searchResults: [],
    sentIdList: [],
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
    // 검색 관련 이벤트 리스너 등록
    $("#searchBtn").on("click", () => this.doSearch());
    $("#keywordSelect").on("change", this._handleKeywordChange.bind(this));
  },

  /**
   * 키워드 변경 핸들러
   * @private
   * @param {Event} e - 이벤트 객체
   */
  _handleKeywordChange(e) {
    const keyword = $(e.target).val();
    if (keyword && !this.state.selectedKeywords.includes(keyword)) {
      this.state.selectedKeywords.push(keyword);
      this._updateKeywordBadges();
    }
  },

  /**
   * 키워드 배지 업데이트
   * @private
   */
  _updateKeywordBadges() {
    const container = $("#keywordBadges");
    container.empty();

    this.state.selectedKeywords.forEach((keyword) => {
      const badge = $(
        `<span class="badge bg-info me-1 mb-1">${keyword} <i class="fas fa-times"></i></span>`
      );
      badge.find("i").on("click", () => {
        this.state.selectedKeywords = this.state.selectedKeywords.filter(
          (k) => k !== keyword
        );
        this._updateKeywordBadges();
      });
      container.append(badge);
    });
  },

  /**
   * 검색 실행
   * @returns {Promise<void>}
   */
  async doSearch() {
    const keyword = $("#searchInput").val().trim();
    if (!keyword && this.state.selectedKeywords.length === 0) {
      return showToast("검색어를 입력하거나 키워드를 선택해주세요.", "warning");
    }

    const score1 = $("#score1").val() || 0;
    const score2 = $("#score2").val() || 0;

    showLoading();

    try {
      const results = await this.searchAjaxCall(keyword, score1, score2);
      this.state.searchResults = results;

      storageManager.setItem(STORAGE_KEYS.SEARCH_RESULTS, results);
      uiModule.updateSearchResult(
        STORAGE_KEYS.SEARCH_RESULTS,
        0,
        "#searchResult"
      );

      const resultCount = results.length;
      showToast(
        `${resultCount}개의 결과를 찾았습니다.`,
        resultCount > 0 ? "success" : "warning"
      );
    } catch (error) {
      console.error("Search error:", error);
      showToast("검색 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 검색 API 호출
   * @param {string} keyword - 검색 키워드
   * @param {number} score1 - 최소 점수
   * @param {number} score2 - 최대 점수
   * @returns {Promise<Array>} - 검색 결과
   */
  async searchAjaxCall(keyword, score1, score2) {
    const searchData = {
      keyword,
      score1,
      score2,
      keywords: this.state.selectedKeywords,
    };

    const response = await fetch(ENDPOINTS.SEARCH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchData),
    });

    if (!response.ok) {
      throw new Error("Search request failed");
    }

    return await response.json();
  },

  /**
   * 검색 결과 중 발송되지 않은 ID만 필터링
   * @returns {Array} - 필터링된 ID 목록
   */
  getUnsentIds() {
    const existingIds = storageManager.getItem(STORAGE_KEYS.EXIST_ID_LISTS);
    const searchResults = storageManager.getItem(STORAGE_KEYS.SEARCH_RESULTS);
    return isExistId(searchResults, existingIds);
  },

  /**
   * 검색 결과에 ID 수동 추가
   * @param {string} manualId - 추가할 ID
   * @param {string} keyword - 검색 키워드
   * @param {string} link - 링크 URL
   * @param {string} title - 제목
   */
  insertSearchList(manualId, keyword, link, title) {
    if (!manualId) return showToast("ID를 입력해주세요.", "warning");

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
    showToast("ID가 추가되었습니다.", "success");
  },

  /**
   * DB에서 슈퍼계정 ID 가져오기
   * @returns {Promise<Array>} - 슈퍼계정 ID 목록
   */
  async getSuperIds() {
    try {
      const response = await fetch(ENDPOINTS.SUPER_IDS);
      if (!response.ok) throw new Error("Failed to get super IDs");
      return await response.json();
    } catch (error) {
      console.error("Error fetching super IDs:", error);
      showToast("슈퍼계정 ID 로드 중 오류가 발생했습니다.", "danger");
      return [];
    }
  },
};
