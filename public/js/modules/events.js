import { STORAGE_KEYS, FLAG, SELECTORS } from "../config/constants.js";
import { ENDPOINTS } from "../services/api.js";
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  CONFIRM_MESSAGES,
} from "../config/messages.js";
import { storageManager } from "../utils/storage.js";
import {
  showLoading,
  hideLoading,
  showToast,
  hideAndSeek,
} from "../utils/helpers.js";
import { getDate, isTimeWithinAllowedRange } from "../utils/date.js";
import { uiModule } from "./ui.js";
import { searchModule } from "./search.js";
import { senderModule } from "./sender.js";
import { templateModule } from "./template.js";
import { keywordModule } from "./keyword.js";
import { mailModule } from "./mail.js";

/**
 * 이벤트 처리 모듈
 */
export const eventsModule = {
  // 상태
  state: {
    socket: null,
    isConnected: false,
    currentTab: "search",
    listeners: [],
  },

  /**
   * 초기화
   * @returns {void}
   */
  init() {
    this._setupEventListeners();
    this._setupTabEvents();
  },

  /**
   * 이벤트 리스너 설정
   * @private
   */
  _setupEventListeners() {
    // 버튼 이벤트
    this._setupButtonEvents();

    // 검색 이벤트
    this._setupSearchEvents();

    // 폼 이벤트
    this._setupFormEvents();

    // 드롭다운 및 선택 이벤트
    this._setupSelectionEvents();

    // 모달 이벤트
    this._setupModalEvents();

    // 이미지 업로드 이벤트
    this._setupImageUploadEvents();

    // 창 크기 조절 이벤트
    $(window).on("resize", () => {
      uiModule.adjustHeight();
      uiModule.resizeButtons();
    });
  },

  /**
   * 탭 이벤트 설정
   * @private
   */
  _setupTabEvents() {
    $(".nav-link").on("click", (e) => {
      const targetId = $(e.currentTarget).attr("id");

      if (targetId.includes("tab")) {
        this.state.currentTab = targetId.replace("Tab", "");

        // 현재 탭에 따라 UI 조정
        switch (this.state.currentTab) {
          case "search":
            hideAndSeek(
              "#searchBody",
              "#senderBody",
              "#keywordBody",
              "#templateBody",
              "#mailBody"
            );
            break;
          case "sender":
            hideAndSeek(
              "#senderBody",
              "#searchBody",
              "#keywordBody",
              "#templateBody",
              "#mailBody"
            );
            senderModule.getSenderList();
            break;
          case "keyword":
            hideAndSeek(
              "#keywordBody",
              "#searchBody",
              "#senderBody",
              "#templateBody",
              "#mailBody"
            );
            const selectedSenderId = senderModule.state.selectedSenderId;
            if (selectedSenderId) {
              keywordModule.getKeyWordList(selectedSenderId);
            }
            break;
          case "template":
            hideAndSeek(
              "#templateBody",
              "#searchBody",
              "#senderBody",
              "#keywordBody",
              "#mailBody"
            );
            templateModule.getSenderTemplateAll();
            break;
          case "mail":
            hideAndSeek(
              "#mailBody",
              "#searchBody",
              "#senderBody",
              "#keywordBody",
              "#templateBody"
            );
            break;
        }
      }
    });
  },

  /**
   * 버튼 이벤트 설정
   * @private
   */
  _setupButtonEvents() {
    // 공통 버튼 이벤트 - 이미 각 모듈에서 처리되는 이벤트는 제외
    $("#refreshBtn").on("click", () => {
      switch (this.state.currentTab) {
        case "search":
          searchModule.refreshSearch();
          break;
        case "sender":
          senderModule.getSenderList();
          break;
        case "keyword":
          const selectedSenderId = senderModule.state.selectedSenderId;
          if (selectedSenderId) {
            keywordModule.getKeyWordList(selectedSenderId);
          }
          break;
        case "template":
          templateModule.getSenderTemplateAll();
          break;
        case "mail":
          // 메일 관련 새로고침
          break;
      }
    });

    // 발송자 이메일 할당 버튼
    $("#assignMailBtn").on("click", () => {
      const emailId = $("#emailSelector").val();
      const agentId = $("#agentSelector").val();
      const agentName = $("#agentSelector option:selected").text();

      if (!emailId || !agentId) {
        return showToast("발송자 이메일과 에이전트를 선택해주세요.", "warning");
      }

      senderModule.assignSenderEmail(emailId, agentId, agentName);

      // 소켓 이벤트 발송
      this.state.socket.emit("assigned", {
        email: emailId,
        mailNo: emailId, // 적절한 메일 번호로 수정 필요
        agentNo: agentId,
        agentName: agentName,
      });
    });

    // 발송자 이메일 해제 버튼
    $("#unassignMailBtn").on("click", () => {
      const emailId = $("#emailSelector").val();
      const agentId = $("#agentSelector").val();

      if (!emailId || !agentId) {
        return showToast("발송자 이메일과 에이전트를 선택해주세요.", "warning");
      }

      senderModule.unassignSenderEmail(emailId, agentId);

      // 소켓 이벤트 발송
      this.state.socket.emit("unassigned", {
        email: emailId,
        mailNo: emailId, // 적절한 메일 번호로 수정 필요
        agentNo: agentId,
      });
    });

    // 모든 발송자 이메일 해제 버튼
    $("#unassignAllBtn").on("click", () => {
      if (confirm(CONFIRM_MESSAGES.UNASSIGN_ALL)) {
        senderModule.unassignAllEmails();

        // 소켓 이벤트 발송
        this.state.socket.emit("unassignAll");
      }
    });

    // 에이전트 이름 변경 버튼
    $("#renameAgentBtn").on("click", () => {
      const agentId = $("#agentSelector").val();
      const newName = $("#newAgentName").val().trim();

      if (!agentId || !newName) {
        return showToast("에이전트와 새 이름을 입력해주세요.", "warning");
      }

      senderModule.renameAgent(agentId, newName);

      // 소켓 이벤트 발송
      this.state.socket.emit("renameAgent", {
        agentNo: agentId,
        newName: newName,
      });
    });
  },

  /**
   * 검색 이벤트 설정
   * @private
   */
  _setupSearchEvents() {
    // 검색 버튼
    $("#searchBtn").on("click", (e) => {
      e.preventDefault();
      searchModule.doSearch();
    });

    // 엔터키 검색
    $("#searchQuery").on("keypress", (e) => {
      if (e.which === 13) {
        e.preventDefault();
        searchModule.doSearch();
      }
    });

    // 민감도 슬라이더
    $("#scoreSlider").on("input", function () {
      $("#scoreValue").text($(this).val());
    });
  },

  /**
   * 폼 이벤트 설정
   * @private
   */
  _setupFormEvents() {
    // 인풋 필드 초기화 버튼
    $(".btn-clear-input").on("click", function () {
      const targetId = $(this).data("target");
      $(targetId).val("");
    });

    // 폼 제출 방지
    $("form").on("submit", (e) => {
      e.preventDefault();
    });

    // 날짜 필드 기본값 설정
    $("input[type='date']").on("focus", function () {
      if (!$(this).val()) {
        $(this).val(getDate().split(" ")[0]);
      }
    });

    // 시간 필드 기본값 설정
    $("input[type='time']").on("focus", function () {
      if (!$(this).val()) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        $(this).val(`${hours}:${minutes}`);
      }
    });
  },

  /**
   * 선택 이벤트 설정
   * @private
   */
  _setupSelectionEvents() {
    // 체크박스 전체 선택/해제
    $(document).on("change", ".select-all", function () {
      const isChecked = $(this).prop("checked");
      const checkboxName = $(this).data("target");
      $(`input[name="${checkboxName}"]`).prop("checked", isChecked);
    });

    // 검색 결과 아이템 선택
    $(document).on("change", ".search-item-checkbox", function () {
      // 선택된 아이템 카운트 표시
      const selectedCount = $(".search-item-checkbox:checked").length;
      $("#selectedItemCount").text(selectedCount);
    });

    // 발송자 목록 항목 클릭 시 키워드 로드
    $(document).on("click", ".sender-item", function () {
      const senderId = $(this).data("id");
      senderModule.setSenderSelection(senderId);
      keywordModule.getKeyWordList(senderId);
    });
  },

  /**
   * 모달 이벤트 설정
   * @private
   */
  _setupModalEvents() {
    // 모달 초기화 공통 이벤트
    $(".modal").on("hidden.bs.modal", function () {
      $(this).find("form").trigger("reset");
      $(this).find(".alert").hide();
    });

    // =======================================
    // 발송자 관련 모달 이벤트 (target-search.ejs)
    // =======================================

    // 발송자 모달 이벤트
    $("#senderModal").on("show.bs.modal", () => {
      $("#senderModalLabel").text("발송기 선택");
      if (!$(".sender-search-area").children().length) {
        $(".sender-search-area").html(`
          <div class="input-group">
            <input
              type="text"
              class="form-control"
              placeholder="발송기 검색"
              id="sender-search"
            />
            <button class="btn btn-outline-primary" id="addSender">
              발송기 추가
            </button>
          </div>
        `);
      }
      senderModule.getSenderList();
    });

    // 발송자 선택 이벤트
    // 주의: sender-item 클래스가 아닌 HTML의 실제 선택자에 따라 수정 필요
    // target-search.ejs에서는 #sender-group 내부 항목들이 클릭 대상
    $(document).on("click", "#sender-group .list-group-item", function () {
      const senderId = $(this).data("id");
      senderModule.setSenderSelection(senderId);
      $("#senderModal").modal("hide");
    });

    // 발송자 추가 버튼 클릭
    // 주의: 실제 HTML에는 addSenderModal이 없음 - 기능 구현 필요
    $(document).on("click", "#addSender", () => {
      // 추가 기능이 구현되어 있지 않음
      uiModule.showToast(
        "발송기 추가 기능이 구현되어 있지 않습니다.",
        "warning"
      );
      // $("#addSenderModal").modal("show"); // 해당 모달이 없음
    });

    // 슈퍼 계정 모달 이벤트
    $("#superAccountModal").on("show.bs.modal", () => {
      // 슈퍼 계정 목록 로드
      // target-search.ejs에는 #superAccountList가 있음
      senderModule.loadSuperAccounts();
    });

    // 슈퍼 계정 추가 버튼
    // #addSuperAccount 버튼 존재
    $(document).on("click", "#addSuperAccount", () => {
      const superId = $("#newSuperAccount").val().trim();
      if (superId) {
        senderModule.addSuperAccount(superId);
      }
    });

    // 슈퍼 계정 삭제 버튼
    // 주의: .delete-super-account 클래스가 HTML에 없을 수 있음
    // 실제 구현에 맞게 선택자 수정 필요
    $(document).on("click", ".delete-super-account", function () {
      const id = $(this).data("id");
      senderModule.deleteSuperAccount(id);
    });

    // 필터 템플릿 모달 이벤트
    // #filterTemplateModal과 #filter-template 버튼이 있음
    $("#filter-template").on("click", () => {
      $("#filterTemplateModalLabel").text("필터 템플릿 관리");
      templateModule.getFilterTemplateAll();
    });

    // 필터 템플릿 삭제 버튼
    // #delete-filter 버튼 있음
    $(document).on("click", "#delete-filter", () => {
      // 주의: .filter-checkbox 클래스가 HTML에 없을 수 있음
      // 실제 구현에 맞게 선택자 수정 필요
      const checkedFilters = $("#filterTemplateModalBody input:checked");
      if (checkedFilters.length) {
        if (
          confirm(
            `선택한 ${checkedFilters.length}개의 필터를 삭제하시겠습니까?`
          )
        ) {
          const noList = [];
          checkedFilters.each(function () {
            noList.push($(this).data("no"));
          });
          templateModule.deleteSpecificFilterList(noList.join(","));
        }
      } else {
        uiModule.showToast("삭제할 필터를 선택해주세요", "warning");
      }
    });

    // =======================================
    // 메일 발송 관련 모달 이벤트 (send-email.ejs)
    // =======================================

    // HTML 템플릿 모달 이벤트 - #controlTemplate 버튼 있음
    $("#controlTemplate").on("click", () => {
      templateModule.getSenderTemplateAll();
    });

    // HTML 템플릿 검색 - #template-search input 있음
    $(document).on("input", "#template-search", function () {
      const searchTerm = $(this).val().toLowerCase();
      // 주의: #template-list li 선택자가 정확히 일치하는지 확인 필요
      $("#template-list li").each(function () {
        const text = $(this).text().toLowerCase();
        $(this).closest(".template-row").toggle(text.includes(searchTerm));
      });
    });

    // 템플릿 선택 이벤트
    // .select-template 클래스가 있음 (확인 필요)
    $(document).on("click", ".select-template", function (e) {
      e.preventDefault();
      const templateNo = $(this).data("no");
      templateModule.getSpecificTemplate(templateNo);
      $("#htmlTemplateModal").modal("hide");
      $("#toggleModal").modal("show");
    });

    // 템플릿 삭제 버튼 - #del-checked-template 버튼 있음
    $(document).on("click", "#del-checked-template", () => {
      // .form-check-input 선택자가 정확한지 확인 필요
      const checkedTemplates = $(".form-check-input:checked");
      if (checkedTemplates.length) {
        if (
          confirm(
            `선택한 ${checkedTemplates.length}개의 템플릿을 삭제하시겠습니까?`
          )
        ) {
          const noList = [];
          checkedTemplates.each(function () {
            noList.push($(this).data("no"));
          });
          templateModule.deleteHtmlTemplateList(noList.join(","));
        }
      } else {
        uiModule.showToast("삭제할 템플릿을 선택해주세요", "warning");
      }
    });

    // 토글 모달 (템플릿 상세) 이벤트 - #toggleModal 있음
    $("#toggleModal").on("show.bs.modal", () => {
      $("#toggleModal-title").text("템플릿 상세 정보");
    });

    // 템플릿 수정 버튼 - #edit-template 버튼 있음
    $(document).on("click", "#edit-template", function () {
      $("#edit-template").addClass("visually-hidden");
      $("#save-template").removeClass("visually-hidden");
      // 주의: .template-content, .template-title 클래스가 정확히 일치하는지 확인 필요
      // 동적으로 생성되는 요소일 가능성 있음
      $(".template-content").attr("contenteditable", "true");
      $(".template-title").attr("contenteditable", "true");
    });

    // 템플릿 저장 버튼 - #save-template 버튼 있음
    $(document).on("click", "#save-template", function () {
      // 주의: #template-id, .template-title, .template-content, .template-subject
      // 선택자들이 동적으로 생성된 요소에 적용되는지 확인 필요
      const templateNo = $("#template-id").val();
      const templateName = $(".template-title").text().trim();
      const contents = $(".template-content").html();
      const mailTitle = $(".template-subject").text().trim();

      templateModule.updateHtmlTemplateContents(
        templateNo,
        templateName,
        mailTitle,
        contents
      );

      $("#save-template").addClass("visually-hidden");
      $("#edit-template").removeClass("visually-hidden");
      $(".template-content").attr("contenteditable", "false");
      $(".template-title").attr("contenteditable", "false");
    });

    // 템플릿 목록으로 돌아가기 - #back-to-template-list 버튼 있음
    $(document).on("click", "#back-to-template-list", function () {
      $("#toggleModal").modal("hide");
      $("#htmlTemplateModal").modal("show");
    });

    // 템플릿 선택 버튼 - .choose-template 클래스 있음
    $(document).on("click", ".choose-template", function () {
      // 주의: .template-content, .template-subject 선택자 확인 필요
      const contents = $(".template-content").html();
      const subject = $(".template-subject").text().trim();

      // 에디터에 템플릿 적용
      mailModule.setTemplateToEditor(contents, subject);

      $("#toggleModal").modal("hide");
    });

    // 서버 상태 모달 - #getServerStatus 버튼 있음
    $("#getServerStatus").on("click", () => {
      // 서버 상태 로드 함수 호출
      // 주의: uiModule.loadServerStatus 함수가 구현되어 있는지 확인 필요
      uiModule.loadServerStatus();
    });

    // 전체 이메일 테스트 - #testAll 버튼 있음
    $("#testAll").on("click", () => {
      const testId = $("#testAllInput").val().trim();
      if (testId) {
        // 주의: mailModule.sendTestAll 함수가 구현되어 있는지 확인 필요
        mailModule.sendTestAll(testId);
      } else {
        uiModule.showToast("테스트 ID를 입력해주세요", "warning");
      }
    });

    // 모달 확인 버튼 공통 처리
    // 주의: .modal-confirm-btn 클래스가 HTML에 없을 수 있음
    $(document).on("click", ".modal-confirm-btn", function () {
      const actionType = $(this).data("action");
      const modalId = $(this).closest(".modal").attr("id");

      switch (actionType) {
        case "add-sender":
          const senderName = $(`#${modalId} .sender-name-input`).val();
          senderModule.addSender(senderName);
          break;
        case "edit-sender":
          const newSenderName = $(`#${modalId} .sender-name-input`).val();
          const oldSenderName = $(`#${modalId}`).data("old-name");
          const senderNo = $(`#${modalId}`).data("sender-no");
          senderModule.updateSenderName(oldSenderName, newSenderName, senderNo);
          break;
      }
    });
  },

  /**
   * 이미지 업로드 이벤트 설정
   * @private
   */
  _setupImageUploadEvents() {
    // 이미지 핸들링 버튼 (Quill 에디터용)
    $("#imageUpload").on("change", function () {
      const files = this.files;
      if (files && files.length > 0) {
        const imageFile = files[0];

        // 이미지 리사이징 처리
        uiModule.resizeImage(imageFile, 500, (resizedFile) => {
          uiModule.readFile(resizedFile, (result) => {
            uiModule.insertToEditor(result);
          });
        });
      }
    });

    // 이미지 선택 버튼
    $("#imageSelectBtn").on("click", function () {
      $("#imageUpload").click();
    });
  },

  /**
   * 메일 발송 이벤트 처리
   * @private
   * @param {Object} data - 이벤트 데이터
   */
  _handleMailSentEvent(data) {
    // 발송한 ID 목록에 추가
    const existIdLists =
      storageManager.getItem(STORAGE_KEYS.EXIST_ID_LISTS) || [];
    const searchResults =
      storageManager.getItem(STORAGE_KEYS.SEARCH_RESULTS) || [];

    if (data.id && !existIdLists.some((item) => item.id === data.id)) {
      // 검색 결과에서 해당 ID 찾기
      const sentItem = searchResults.find((item) => item.id === data.id);

      if (sentItem) {
        existIdLists.push({
          ...sentItem,
          sentDate: data.sentDate || getDate(),
        });

        // 검색 결과에서 제거
        const updatedSearchResults = searchResults.filter(
          (item) => item.id !== data.id
        );

        // 스토리지 업데이트
        storageManager.setItem(STORAGE_KEYS.EXIST_ID_LISTS, existIdLists);
        storageManager.setItem(
          STORAGE_KEYS.SEARCH_RESULTS,
          updatedSearchResults
        );

        // UI 업데이트
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

        showToast(`ID '${data.id}'에 메일이 발송되었습니다.`, "success");
      }
    }
  },

  /**
   * 발송자 이메일 업데이트 이벤트 처리
   * @private
   * @param {Object} data - 이벤트 데이터
   */
  _handleSenderEmailUpdatedEvent(data) {
    // 발송자 이메일 정보 업데이트
    if (data.senderEmail && data.agentName && data.agentNo) {
      uiModule.findEmailEditBadge(data.agentName, data.agentNo);

      showToast(
        `${data.senderEmail} 계정이 발송기 [${data.agentName}] 에서 수정되었습니다.`,
        "info"
      );

      // 필요시 발송자 목록 갱신
      senderModule.getSenderList();
    }
  },

  /**
   * 발송자 이메일 추가 이벤트 처리
   * @private
   * @param {Object} data - 이벤트 데이터
   */
  _handleSenderEmailAddedEvent(data) {
    // 발송자 이메일 추가
    if (data.senderEmail && data.mailNo && data.agentName && data.agentNo) {
      uiModule.findEmailAddBadge(data.mailNo, data.agentName, data.agentNo);

      showToast(
        `${data.senderEmail} 계정이 발송기 [${data.agentName}] 에서 추가되었습니다.`,
        "success"
      );

      // 필요시 발송자 목록 갱신
      senderModule.getSenderList();
    }
  },

  /**
   * 발송자 이메일 삭제 이벤트 처리
   * @private
   * @param {Object} data - 이벤트 데이터
   */
  _handleSenderEmailRemovedEvent(data) {
    // 발송자 이메일 삭제
    if (data.senderEmail) {
      if (data.mailNo && data.agentNo) {
        uiModule.findEmailRemoveBadge(data.mailNo, data.agentNo);
      }

      showToast(
        `${data.senderEmail} 계정이 발송기에서 삭제되었습니다.`,
        "warning"
      );

      // 필요시 발송자 목록 갱신
      senderModule.getSenderList();
    }
  },

  /**
   * 키워드 업데이트 이벤트 처리
   * @private
   * @param {Object} data - 이벤트 데이터
   */
  _handleKeywordUpdatedEvent(data) {
    // 키워드 업데이트
    if (data.senderId && data.action) {
      const selectedSenderId = senderModule.state.selectedSenderId;

      // 현재 선택된 발송자와 동일한 경우 키워드 목록 갱신
      if (selectedSenderId === data.senderId) {
        keywordModule.getKeyWordList(selectedSenderId);
      }

      let message = "";
      switch (data.action) {
        case "add":
          message = `키워드가 추가되었습니다: ${data.keyword}`;
          break;
        case "delete":
          message = `키워드가 삭제되었습니다: ${data.keyword}`;
          break;
        case "update":
          message = `키워드가 업데이트되었습니다: ${data.keyword}`;
          break;
      }

      if (message) {
        showToast(message, "info");
      }
    }
  },

  /**
   * 템플릿 업데이트 이벤트 처리
   * @private
   * @param {Object} data - 이벤트 데이터
   */
  _handleTemplateUpdatedEvent(data) {
    // 템플릿 업데이트
    if (data.action) {
      let message = "";
      switch (data.action) {
        case "add":
          message = `템플릿이 추가되었습니다: ${data.templateName}`;
          break;
        case "delete":
          message = `템플릿이 삭제되었습니다: ${data.templateName}`;
          break;
        case "update":
          message = `템플릿이 업데이트되었습니다: ${data.templateName}`;
          break;
      }

      if (message) {
        showToast(message, "info");
      }

      // 현재 탭이 템플릿인 경우 템플릿 목록 갱신
      if (this.state.currentTab === "template") {
        templateModule.getSenderTemplateAll();
      }
    }
  },

  /**
   * 이벤트 리스너 등록
   * @param {string} eventName - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @returns {void}
   */
  on(eventName, callback) {
    if (!this.state.listeners[eventName]) {
      this.state.listeners[eventName] = [];
    }

    this.state.listeners[eventName].push(callback);
  },

  /**
   * 이벤트 발생시키기
   * @param {string} eventName - 이벤트 이름
   * @param {*} data - 이벤트 데이터
   * @returns {void}
   */
  emit(eventName, data) {
    if (this.state.listeners[eventName]) {
      this.state.listeners[eventName].forEach((callback) => {
        callback(data);
      });
    }
  },

  /**
   * 이벤트 리스너 제거
   * @param {string} eventName - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @returns {void}
   */
  off(eventName, callback) {
    if (this.state.listeners[eventName]) {
      this.state.listeners[eventName] = this.state.listeners[eventName].filter(
        (cb) => cb !== callback
      );
    }
  },
};
