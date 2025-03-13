import { STORAGE_KEYS } from "../config/constants.js";
import { storageManager } from "../utils/storage.js";

/**
 * UI 모듈 - UI 업데이트 및 조작 담당
 */
export const uiModule = {
  /**
   * 초기화
   * @returns {void}
   */
  init() {
    // 화면 크기에 따른 UI 조정
    this.adjustHeight();
    $(window).on("resize", this.adjustHeight);

    // 버튼 크기 조정
    this.resizeButtons();
    $(window).on("resize", this.resizeButtons);
  },

  /**
   * 높이 조정 - 패널 및 에디터 영역 크기 조정
   */
  adjustHeight() {
    const totalHeight = $("#search-panel").outerHeight(true);
    const areaHeight = $(".area-wrapper").outerHeight(true);
    const navPillsHeight = $(".nav-pills").outerHeight(true);
    const mailTestAreaHeight = $(".mail-add-test-area").outerHeight(true);
    const availableHeight =
      totalHeight - areaHeight - navPillsHeight - mailTestAreaHeight;

    $("#senderTotalList").outerHeight(availableHeight);

    const mailBtnAreaHeight = $(".mail-btn-area").outerHeight(true);
    const calc = availableHeight + mailBtnAreaHeight * 2;
    $("#editor").height(calc);

    $(".nav-item").each(function (index) {
      if (index <= 2) {
        $("select").outerHeight(availableHeight + mailTestAreaHeight);
      }
    });
  },

  /**
   * 버튼 크기 조정
   */
  resizeButtons() {
    const btnWidth = $(".mail-btn-area button").outerWidth();
    $(".mail-btn-area button").outerHeight(btnWidth);
  },

  /**
   * 검색 결과를 UI에 업데이트
   * @param {string} sessionRepo - 세션 스토리지 키
   * @param {number} index - 탭 인덱스
   * @param {string} selectTagId - 대상 선택자
   */
  updateSearchResult(sessionRepo, index, selectTagId) {
    const list = storageManager.getItem(sessionRepo);
    this.fillDOM(list, index, selectTagId);

    const count = list.length;
    $(`.badge-count:eq(${index})`).text(count);
  },

  /**
   * DOM에 리스트 데이터 채우기
   * @param {Array} list - 데이터 리스트
   * @param {number} index - 탭 인덱스
   * @param {string} selectTagId - 대상 선택자
   */
  fillDOM(list, index, selectTagId) {
    const $select = $(selectTagId);
    $select.empty();

    if (list.length === 0) {
      $select.append('<option value="">데이터가 없습니다</option>');
      return;
    }

    switch (index) {
      case 0: // 검색 결과
        list.forEach((item) => {
          const option = $(
            `<option value="${item.id}" ${
              item.isManual ? 'class="text-primary"' : ""
            }></option>`
          );
          const textContent = item.isManual
            ? `${item.id} (수동추가)`
            : `${item.id} | ${item.title || "제목 없음"} | ${
                item.keyword || "키워드 없음"
              }`;
          option.text(textContent);
          option.data("item", item);
          $select.append(option);
        });
        break;

      case 1: // 발송 목록
        list.forEach((item) => {
          const option = $(`<option value="${item.id}"></option>`);
          option.text(`${item.id} | ${item.date || "날짜 없음"}`);
          option.data("item", item);
          $select.append(option);
        });
        break;

      case 2: // 발송자 이메일
        if (typeof list === "object" && !Array.isArray(list)) {
          // 발송자 이메일 정보는 객체 형태
          for (const [email, info] of Object.entries(list)) {
            const option = $(`<option value="${email}"></option>`);
            option.text(`${email} | ${info.agent_name || "발송기 없음"}`);
            option.data("info", info);
            $select.append(option);
          }
        } else if (Array.isArray(list)) {
          list.forEach((item) => {
            const option = $(
              `<option value="${item.id || item.email}"></option>`
            );
            option.text(item.id || item.email);
            option.data("item", item);
            $select.append(option);
          });
        }
        break;

      default:
        list.forEach((item) => {
          const option = $(`<option value="${item.id || item.no}"></option>`);
          option.text(item.name || item.id || "이름 없음");
          option.data("item", item);
          $select.append(option);
        });
    }
  },

  /**
   * 기본 LI 태그 생성
   * @param {string} senderName - 발송자 이름
   * @param {string} no - 발송자 번호
   * @returns {string} - HTML 문자열
   */
  baseLiTag(senderName, no) {
    return `
      <li class="list-group-item d-flex justify-content-between align-items-center" data-no="${no}">
        <div>${senderName}</div>
        <div>
          <button class="btn btn-sm btn-outline-primary me-1 btn-change" data-no="${no}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger btn-remove" data-no="${no}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </li>
    `;
  },

  /**
   * 키워드 LI 태그 생성
   * @param {string} keyword - 키워드
   * @param {string} no - 키워드 번호
   * @returns {string} - HTML 문자열
   */
  keywordLiTag(keyword, no) {
    return `
      <li class="list-group-item d-flex justify-content-between align-items-center" data-no="${no}">
        <div>${keyword}</div>
        <div>
          <button class="btn btn-sm btn-outline-danger btn-remove-keyword" data-no="${no}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </li>
    `;
  },

  /**
   * 변경된 LI 태그 생성
   * @param {string} senderName - 발송자 이름
   * @param {string} agent_no - 발송기 번호
   * @returns {string} - HTML 문자열
   */
  changedLiTag(senderName, agent_no) {
    return `
      <li class="list-group-item d-flex justify-content-between align-items-center changed-item" data-agent="${agent_no}">
        <div>${senderName}</div>
        <div>
          <button class="btn btn-sm btn-outline-success me-1 btn-rollback" data-agent="${agent_no}">
            <i class="fas fa-undo"></i>
          </button>
        </div>
      </li>
    `;
  },

  /**
   * 발송자 목록 항목 생성
   * @param {Array} senderNameNums - 발송자 정보 배열
   * @returns {string} - HTML 문자열
   */
  generateSenderListItems(senderNameNums) {
    let listItems = "";
    senderNameNums.forEach((item) => {
      listItems += this.baseLiTag(item.name, item.no);
    });

    // $(".sender-search-area").html(searchBar);
    $("#senderModal .modal-body ul").html(listItems);
  },

  /**
   * 키워드 목록 항목 생성
   * @param {Array} keywords - 키워드 배열
   */
  generateKeyWordListItems(keywords) {
    const $list = $("#keywordList");
    $list.empty();

    keywords.forEach((item) => {
      $list.append(this.keywordLiTag(item.keyword, item.no));
    });
  },

  /**
   * 발송자 이메일 변경 마크 처리
   * @param {Array} arrOfEmail - 이메일 배열
   */
  markCheckedSenderEmails(arrOfEmail) {
    $('#senderEmailList input[type="checkbox"]').prop("checked", false);

    arrOfEmail.forEach((email) => {
      $(`#senderEmailList input[value="${email}"]`).prop("checked", true);
    });
  },

  /**
   * 발송자 이메일 배지 추가
   * @param {string} mail_no - 메일 번호
   * @param {string} agentName - 발송기 이름
   * @param {string} agent_no - 발송기 번호
   */
  findEmailAddBadge(mail_no, agentName, agent_no) {
    const badge = $(
      `<span class="badge agent-badge text-bg-warning bg-opacity-50 text-opacity-75 ms-2" data-agent="${agent_no}">${agentName}</span>`
    );
    $(`#email-${mail_no}`).append(badge);
  },

  /**
   * 발송자 이메일 배지 수정
   * @param {string} agentName - 발송기 이름
   * @param {string} agent_no - 발송기 번호
   */
  findEmailEditBadge(agentName, agent_no) {
    $(`.agent-badge[data-agent="${agent_no}"]`).text(agentName);
  },

  /**
   * 발송자 이메일 배지 제거
   * @param {string} mail_no - 메일 번호
   * @param {string} agent_no - 발송기 번호
   */
  findEmailRemoveBadge(mail_no, agent_no) {
    $(`#email-${mail_no} .agent-badge[data-agent="${agent_no}"]`).remove();
  },

  /**
   * 스피너 상태 변경
   * @param {number} index - 인덱스
   * @param {string} successFailure - 성공/실패 상태
   */
  changeSpinnerState(index, successFailure) {
    const $spinner = $(`#spinner-${index}`);
    $spinner.removeClass("spinner-border text-success text-danger");

    if (successFailure === "loading") {
      $spinner.addClass("spinner-border");
    } else if (successFailure === "success") {
      $spinner.addClass("text-success").html('<i class="fas fa-check"></i>');
    } else if (successFailure === "failure") {
      $spinner.addClass("text-danger").html('<i class="fas fa-times"></i>');
    }
  },

  /**
   * 드롭다운 목록 생성
   * @param {Array} listData - 목록 데이터
   * @returns {string} - HTML 문자열
   */
  createDropdownList(listData) {
    let html = "";

    listData.forEach((item) => {
      html += `<option value="${item.no}">${item.name}</option>`;
    });

    return html;
  },
};
