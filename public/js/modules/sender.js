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
import { uiModule } from "./ui.js";

/**
 * 발송자 관리 모듈
 */
export const senderModule = {
  // 상태
  state: {
    senderList: [],
    selectedSenderId: null,
    selectedSenderName: null,
    senderEmailInfo: {},
    senderEmailTotal: null,
  },

  /**
   * 초기화
   * @returns {void}
   */
  init() {
    this._setupEventListeners();
    this.getSenderList();
  },

  /**
   * 이벤트 리스너 설정
   * @private
   */
  _setupEventListeners() {
    $("#senderSelect").on("change", this._handleSenderChange.bind(this));
    $("#updateSenderBtn").on("click", this.updateSenderName.bind(this));
    $("#deleteSenderBtn").on("click", this.deleteSenderFromDB.bind(this));
    $("#addSenderBtn").on("click", this.addSender.bind(this));
  },

  /**
   * 발송자 변경 핸들러
   * @private
   * @param {Event} e - 이벤트 객체
   */
  _handleSenderChange(e) {
    const senderNo = $(e.target).val();
    if (senderNo) {
      this.state.selectedSenderId = senderNo;
      this.state.selectedSenderName = $(e.target)
        .find("option:selected")
        .text();
      $("#senderName").val(this.state.selectedSenderName);
      this.getSenderEmail(senderNo);
    }
  },

  /**
   * 발송자 목록 가져오기
   * @returns {Promise<void>}
   */
  async getSenderList() {
    try {
      showLoading();
      const response = await fetch(ENDPOINTS.SENDER_LIST);

      if (!response.ok) {
        throw new Error("Failed to fetch sender list");
      }

      const data = await response.json();
      this.state.senderList = data.map((json) => ({
        no: json.no,
        name: json.name,
      }));

      $("#senderModalLabel").text("발송기 선택");

      // const $select = $("#senderSelect");
      // $select.empty();
      // $select.append('<option value="">발송자 선택</option>');

      // data.forEach((sender) => {
      //   $select.append(`<option value="${sender.no}">${sender.name}</option>`);
      // });

      // 발송자 목록을 기반으로 UI 업데이트
      uiModule.generateSenderListItems(this.state.senderList);
    } catch (error) {
      console.error("Error fetching sender list:", error);
      showToast("발송자 목록을 가져오는 데 실패했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 발송자 선택
   * @param {string} senderNo - 발송자 번호
   * @returns {Promise<void>}
   */
  async chooseSender() {
    const senderNo = $("#senderTotalList").val();
    if (!senderNo) {
      return showToast("발송자를 선택해주세요.", "warning");
    }

    try {
      const sender = this.state.senderList.find((s) => s.no === senderNo);
      if (!sender) {
        return showToast("유효하지 않은 발송자입니다.", "warning");
      }

      this.state.selectedSenderId = senderNo;
      this.state.selectedSenderName = sender.name;

      $("#senderSelect").val(senderNo);
      $("#senderName").val(sender.name);

      await this.getSenderEmail(senderNo);

      // 키워드 목록 업데이트
      if (window.keywordModule) {
        await window.keywordModule.getKeyWordList(senderNo);
      }

      showToast(`발송자 '${sender.name}'이(가) 선택되었습니다.`, "success");
    } catch (error) {
      console.error("Error choosing sender:", error);
      showToast("발송자 선택 중 오류가 발생했습니다.", "danger");
    }
  },

  /**
   * 발송자 이메일 정보 가져오기
   * @param {string} senderNo - 발송자 번호
   * @returns {Promise<void>}
   */
  async getSenderEmail(senderNo) {
    try {
      const response = await fetch(`${ENDPOINTS.SENDER_EMAIL}/${senderNo}`);

      if (!response.ok) {
        throw new Error("Failed to fetch sender email");
      }

      const data = await response.json();
      this.state.senderEmailInfo = data;
      storageManager.setItem(STORAGE_KEYS.SENDER_EMAIL, data);

      uiModule.updateSearchResult(
        STORAGE_KEYS.SENDER_EMAIL,
        2,
        "#senderIdList"
      );
    } catch (error) {
      console.error("Error fetching sender email:", error);
      showToast("발송자 이메일 정보를 가져오는 데 실패했습니다.", "danger");
    }
  },

  /**
   * 발송자 이름 업데이트
   * @returns {Promise<void>}
   */
  async updateSenderName() {
    const senderNo = this.state.selectedSenderId;
    const senderName = this.state.selectedSenderName;
    const newSenderName = $("#senderName").val().trim();

    if (!senderNo) {
      return showToast("발송자를 선택해주세요.", "warning");
    }

    if (!newSenderName) {
      return showToast("새 발송자 이름을 입력해주세요.", "warning");
    }

    if (senderName === newSenderName) {
      return showToast("현재 이름과 동일합니다.", "warning");
    }

    try {
      showLoading();
      const response = await fetch(ENDPOINTS.UPDATE_SENDER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderNo,
          newSenderName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update sender name");
      }

      await this.getSenderList();

      this.state.selectedSenderName = newSenderName;
      $("#senderSelect").val(senderNo);

      showToast(
        `발송자 이름이 '${newSenderName}'(으)로 업데이트되었습니다.`,
        "success"
      );
    } catch (error) {
      console.error("Error updating sender name:", error);
      showToast("발송자 이름 업데이트 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 새 발송자 추가
   * @returns {Promise<void>}
   */
  async addSender() {
    const newSenderName = $("#newSenderName").val().trim();

    if (!newSenderName) {
      return showToast("발송자 이름을 입력해주세요.", "warning");
    }

    try {
      showLoading();
      const response = await fetch(ENDPOINTS.ADD_SENDER_MAIL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderName: newSenderName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add sender");
      }

      const result = await response.json();

      await this.getSenderList();

      $("#newSenderName").val("");
      showToast(`발송자 '${newSenderName}'이(가) 추가되었습니다.`, "success");
    } catch (error) {
      console.error("Error adding sender:", error);
      showToast("발송자 추가 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 발송자 삭제
   * @returns {Promise<void>}
   */
  async deleteSenderFromDB() {
    const senderNo = this.state.selectedSenderId;

    if (!senderNo) {
      return showToast("발송자를 선택해주세요.", "warning");
    }

    const confirmed = confirm(CONFIRM_MESSAGES.DELETE_SENDER);
    if (!confirmed) return;

    try {
      showLoading();
      const response = await fetch(`${ENDPOINTS.DELETE_SENDER}/${senderNo}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete sender");
      }

      await this.getSenderList();

      this.state.selectedSenderId = null;
      this.state.selectedSenderName = null;
      $("#senderName").val("");
      $("#senderSelect").val("");

      storageManager.setItem(STORAGE_KEYS.SENDER_EMAIL, {});
      uiModule.updateSearchResult(
        STORAGE_KEYS.SENDER_EMAIL,
        2,
        "#senderIdList"
      );

      showToast("발송자가 삭제되었습니다.", "success");
    } catch (error) {
      console.error("Error deleting sender:", error);
      showToast("발송자 삭제 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 발송자 메일 계정 추가
   * @param {string} newId - 새 이메일 ID
   * @param {string} newPw - 이메일 비밀번호
   * @param {Function} messageCallback - 결과 메시지 콜백
   * @returns {Promise<void>}
   */
  async addSenderMailAccount(newId, newPw, messageCallback) {
    if (!this.state.selectedSenderId) {
      return showToast("발송자를 선택해주세요.", "warning");
    }

    if (!newId || !newPw) {
      return showToast("이메일 ID와 비밀번호를 모두 입력해주세요.", "warning");
    }

    if (!isValidEmail(newId)) {
      return showToast("유효한 이메일 주소를 입력해주세요.", "warning");
    }

    try {
      showLoading();
      const response = await fetch(`${ENDPOINTS.ADD_SENDER}/mail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: this.state.selectedSenderId,
          newId,
          newPw,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add sender mail account");
      }

      const result = await response.json();

      await this.getSenderList();

      messageCallback(result.message);
    } catch (error) {
      console.error("Error adding sender mail account:", error);
      showToast("발송자 메일 계정 추가 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },
};
