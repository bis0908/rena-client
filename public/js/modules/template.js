import { ENDPOINTS } from "../services/api.js";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONFIRM_MESSAGES,
} from "../config/messages.js";
import { showLoading, hideLoading, showToast } from "../utils/helpers.js";

/**
 * 템플릿 관리 모듈
 */
export const templateModule = {
  // 상태
  state: {
    templateList: [],
    filterTemplateList: [],
    selectedTemplateName: null,
    selectedTemplateContents: null,
    selectedTemplateNo: null,
    selectedTemplateSubject: null,
  },

  /**
   * 초기화
   * @returns {void}
   */
  init() {
    this._setupEventListeners();
    // this.getSenderTemplateAll();
    this.getFilterTemplateAll();
  },

  /**
   * 이벤트 리스너 설정
   * @private
   */
  _setupEventListeners() {
    $("#templateSelect").on("change", this._handleTemplateChange.bind(this));
    $("#saveTemplateBtn").on("click", this.saveTemplate.bind(this));
    $("#deleteTemplateBtn").on("click", this.deleteHtmlTemplate.bind(this));
  },

  /**
   * 템플릿 변경 핸들러
   * @private
   * @param {Event} e - 이벤트 객체
   */
  _handleTemplateChange(e) {
    const templateNo = $(e.target).val();
    if (templateNo) {
      this.getSpecificTemplate(templateNo);
    }
  },

  /**
   * 모든 발송자 템플릿 가져오기
   * @returns {Promise<void>}
   */
  async getSenderTemplateAll() {
    try {
      showLoading();
      const response = await fetch(ENDPOINTS.GET_HTML_TEMPLATE_ALL);

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      this.state.templateList = data;

      this.createTemplate(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      showToast("템플릿 목록을 가져오는 데 실패했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 필터 템플릿 가져오기
   * @returns {Promise<void>}
   */
  async getFilterTemplateAll() {
    try {
      const response = await fetch(ENDPOINTS.GET_FILTER_TEMPLATE_ALL);

      if (!response.ok) {
        throw new Error("Failed to fetch filter templates");
      }

      const data = await response.json();
      this.state.filterTemplateList = data;

      this.createFilterList(data);
    } catch (error) {
      console.error("Error fetching filter templates:", error);
      showToast("필터 템플릿 로드 중 오류가 발생했습니다.", "danger");
    }
  },

  /**
   * 템플릿 목록 생성
   * @param {Array} templateList - 템플릿 목록
   */
  createTemplate(templateList) {
    $("#htmlTemplateModalBody").empty();
    const row = $(`<ul class="list-group" id="template-list"></ul>`);
    $("#htmlTemplateModalBody").append(row);

    templateList.data.forEach((template, index) => {
      const preview = `
      <div class="d-flex justify-content-start template-row">
      <input type="checkbox" class="form-check-input me-2 place-self-center" id=template${template.no} data-no=${template.no} data-template-id=${template.template_no}>
      <li class="list-group-item w-100 ellipsis" id=template${template.no}>
        <div class="fw-bold fs-6 template-name">${template.name} - ${template.template_name}
          <a href='#' class="btn stretched-link select-template p-0" data-bs-target="#toggleModal" data-no=${template.template_no}></a>
        </div>
        <div class="ellipsis">${template.template_subject}</div>
      </li>
      </div>
    `;
      $("#template-list").append(preview);
    });

    $("#htmlTemplateModalLabel").text("HTML Template List");
    $("#htmlTemplateModal").modal("show");
    setTimeout(() => {
      $("#template-search").trigger("focus");
    }, 500);
  },

  /**
   * 필터 목록 생성
   * @param {Array} filterList - 필터 목록
   */
  createFilterList(filterList) {
    const $select = $("#filterSelect");
    $select.empty();
    $select.append('<option value="">필터 선택</option>');

    filterList.data.forEach((filter) => {
      $select.append(`<option value="${filter.no}">${filter.name}</option>`);
      this.createFilterBadgeInTemplateList(filter);
    });
  },

  /**
   * 템플릿 필터 배지 생성
   * @param {Object} filterObj - 필터 객체
   */
  createFilterBadgeInTemplateList(filterObj) {
    const filterName = filterObj.name;
    const filterArray = JSON.parse(filterObj.filter_array);

    // 필터 배지 생성 로직
    const $filterBadgeContainer = $("#filterBadges");
    const badge = $(`
      <div class="filter-badge badge rounded-pill bg-info bg-opacity-75 mb-2 me-2 p-2">
        <span class="filter-name">${filterName}</span>
        <button type="button" class="btn-close btn-close-white ms-2" aria-label="Close"></button>
      </div>
    `);

    badge.find(".btn-close").on("click", function () {
      $(this).parent().remove();
    });

    badge.data("filter", filterArray);
    $filterBadgeContainer.append(badge);
  },

  /**
   * 특정 템플릿 정보 가져오기
   * @param {string} no - 템플릿 번호
   * @returns {Promise<void>}
   */
  async getSpecificTemplate(no) {
    try {
      const response = await fetch(`${ENDPOINTS.TEMPLATE}/${no}`);

      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }

      const template = await response.json();

      if (template) {
        this.state.selectedTemplateNo = no;
        this.state.selectedTemplateName = template.name;
        this.state.selectedTemplateContents = template.contents;
        this.state.selectedTemplateSubject = template.subject;

        this.setHtmlTemplate(
          template.name,
          template.contents,
          template.subject
        );
      }
    } catch (error) {
      console.error("Error fetching template:", error);
      showToast("템플릿 정보를 가져오는 데 실패했습니다.", "danger");
    }
  },

  /**
   * HTML 템플릿 설정
   * @param {string} templateName - 템플릿 이름
   * @param {string} contents - 템플릿 내용
   * @param {string} subject - 이메일 제목
   */
  setHtmlTemplate(templateName, contents, subject) {
    $("#templateName").val(templateName);
    $("#subjectInput").val(subject || "");

    // Quill 에디터가 초기화되어 있다고 가정
    if (window.quill) {
      window.quill.root.innerHTML = contents;
    }
  },

  /**
   * HTML 템플릿 저장
   * @returns {Promise<void>}
   */
  async saveTemplate() {
    const templateName = $("#templateName").val().trim();
    const subject = $("#subjectInput").val().trim();
    const contents = window.quill ? window.quill.root.innerHTML : "";
    const senderId = window.senderModule?.state.selectedSenderId;

    if (!templateName) {
      return showToast("템플릿 이름을 입력해주세요.", "warning");
    }

    if (!subject) {
      return showToast("이메일 제목을 입력해주세요.", "warning");
    }

    if (!contents) {
      return showToast("템플릿 내용을 입력해주세요.", "warning");
    }

    try {
      showLoading();

      // 템플릿 이름 중복 확인
      const exists = await this.checkHtmlTemplate(templateName);

      if (exists && !this.state.selectedTemplateNo) {
        return showToast("동일한 이름의 템플릿이 이미 존재합니다.", "warning");
      }

      if (this.state.selectedTemplateNo) {
        // 업데이트
        await this.updateHtmlTemplate(
          templateName,
          contents,
          senderId,
          subject
        );
      } else {
        // 새로 추가
        const response = await fetch(ENDPOINTS.TEMPLATES, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: templateName,
            contents,
            subject,
            sender_id: senderId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save template");
        }

        await this.getSenderTemplateAll();
        showToast("템플릿이 저장되었습니다.", "success");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      showToast("템플릿 저장 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 템플릿 이름 중복 확인
   * @param {string} templateName - 템플릿 이름
   * @returns {Promise<boolean>} - 중복 여부
   */
  async checkHtmlTemplate(templateName) {
    try {
      const response = await fetch(
        `${ENDPOINTS.TEMPLATE}/check/${templateName}`
      );

      if (!response.ok) {
        throw new Error("Failed to check template");
      }

      const result = await response.json();
      return result.exists;
    } catch (error) {
      console.error("Error checking template:", error);
      return false;
    }
  },

  /**
   * HTML 템플릿 업데이트
   * @param {string} templateName - 템플릿 이름
   * @param {string} contents - 템플릿 내용
   * @param {string} senderId - 발송자 ID
   * @param {string} subject - 이메일 제목
   * @returns {Promise<void>}
   */
  async updateHtmlTemplate(templateName, contents, senderId, subject) {
    try {
      const response = await fetch(ENDPOINTS.UPDATE_TEMPLATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          no: this.state.selectedTemplateNo,
          name: templateName,
          contents,
          subject,
          sender_id: senderId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update template");
      }

      await this.getSenderTemplateAll();
      showToast("템플릿이 업데이트되었습니다.", "success");
    } catch (error) {
      console.error("Error updating template:", error);
      showToast("템플릿 업데이트 중 오류가 발생했습니다.", "danger");
    }
  },

  /**
   * HTML 템플릿 삭제
   * @returns {Promise<void>}
   */
  async deleteHtmlTemplate() {
    if (!this.state.selectedTemplateNo) {
      return showToast("삭제할 템플릿을 선택해주세요.", "warning");
    }

    const confirmed = confirm(CONFIRM_MESSAGES.DELETE_TEMPLATE);
    if (!confirmed) return;

    try {
      showLoading();
      const response = await fetch(
        `${ENDPOINTS.DELETE_TEMPLATE}/${this.state.selectedTemplateNo}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      // 상태 초기화
      this.state.selectedTemplateNo = null;
      this.state.selectedTemplateName = null;
      this.state.selectedTemplateContents = null;
      this.state.selectedTemplateSubject = null;

      // UI 초기화
      $("#templateName").val("");
      $("#subjectInput").val("");
      if (window.quill) {
        window.quill.root.innerHTML = "";
      }
      $("#templateSelect").val("");

      await this.getSenderTemplateAll();
      showToast("템플릿이 삭제되었습니다.", "success");
    } catch (error) {
      console.error("Error deleting template:", error);
      showToast("템플릿 삭제 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 여러 템플릿 삭제
   * @param {Array} noList - 삭제할 템플릿 번호 목록
   * @returns {Promise<void>}
   */
  async deleteHtmlTemplateList(noList) {
    if (!noList || noList.length === 0) {
      return showToast("삭제할 템플릿을 선택해주세요.", "warning");
    }

    const confirmed = confirm(
      `선택한 ${noList.length}개의 템플릿을 삭제하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      showLoading();
      const response = await fetch(ENDPOINTS.DELETE_TEMPLATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noList }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete templates");
      }

      await this.getSenderTemplateAll();
      showToast(`${noList.length}개의 템플릿이 삭제되었습니다.`, "success");
    } catch (error) {
      console.error("Error deleting templates:", error);
      showToast("템플릿 삭제 중 오류가 발생했습니다.", "danger");
    } finally {
      hideLoading();
    }
  },

  /**
   * 필터 템플릿 설정
   * @param {string} filterName - 필터 이름
   * @param {Array} filterArray - 필터 배열
   * @returns {Promise<void>}
   */
  async setFilterTemplate(filterName, filterArray) {
    if (!filterName) {
      return showToast("필터 이름을 입력해주세요.", "warning");
    }

    if (!filterArray || filterArray.length === 0) {
      return showToast("필터 조건을 설정해주세요.", "warning");
    }

    try {
      const response = await fetch(ENDPOINTS.TEMPLATES + "/filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: filterName,
          filter_array: JSON.stringify(filterArray),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save filter template");
      }

      await this.getFilterTemplateAll();
      showToast("필터 템플릿이 저장되었습니다.", "success");
    } catch (error) {
      console.error("Error saving filter template:", error);
      showToast("필터 템플릿 저장 중 오류가 발생했습니다.", "danger");
    }
  },
};
