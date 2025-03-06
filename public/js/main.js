import { STORAGE_KEYS } from "./config/constants.js";
import { socketService } from "./services/socket.js";
import { ENDPOINTS } from "./services/api.js";
import { searchModule } from "./modules/search.js";
import { senderModule } from "./modules/sender.js";
import { templateModule } from "./modules/template.js";
import { keywordModule } from "./modules/keyword.js";
import { mailModule } from "./modules/mail.js";
import { uiModule } from "./modules/ui.js";
import { eventsModule } from "./modules/events.js";

/**
 * 애플리케이션 메인 모듈 - 앱 초기화 및 부트스트래핑 담당
 */
export const app = {
  /**
   * 모듈 초기화 및 애플리케이션 부트스트랩
   * @returns {void}
   */
  init() {
    // 모듈 초기화 순서 설정
    this._initializeModules();

    // Quill 에디터 초기화
    this._initializeQuillEditor();

    // 초기 UI 상태 설정
    this._setInitialUIState();

    console.log("Application initialized successfully");
  },

  /**
   * 모듈 초기화 및 의존성 관리
   * @private
   */
  _initializeModules() {
    // 전역 변수로 모듈 등록 (기존 코드와의 호환성 유지)
    window.searchModule = searchModule;
    window.senderModule = senderModule;
    window.templateModule = templateModule;
    window.keywordModule = keywordModule;
    window.mailModule = mailModule;
    window.uiModule = uiModule;

    // 1. 기반 서비스 초기화
    socketService.init();

    // 2. UI 기반 모듈 초기화
    uiModule.init();

    // 3. 기능 모듈 초기화
    searchModule.init();
    senderModule.init();
    templateModule.init();
    keywordModule.init();
    mailModule.init();

    // 4. 이벤트 모듈 초기화 (다른 모듈에 의존하므로 마지막에 초기화)
    eventsModule.init();
  },

  /**
   * Quill 에디터 초기화
   * @private
   */
  _initializeQuillEditor() {
    if (typeof Quill !== "undefined") {
      // 에디터 툴바 설정
      const toolbarOptions = [
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ header: 1 }, { header: 2 }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ script: "sub" }, { script: "super" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ direction: "rtl" }],
        [{ size: ["small", false, "large", "huge"] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ["clean"],
        ["link", "image"],
      ];

      // 이미지 핸들러 정의
      const imageHandler = function () {
        $("#imageUpload").click();
      };

      // Quill 인스턴스 생성
      window.quill = new Quill("#editor", {
        modules: {
          toolbar: {
            container: toolbarOptions,
            handlers: {
              image: imageHandler,
            },
          },
        },
        theme: "snow",
      });
    } else {
      console.warn("Quill editor not available");
    }
  },

  /**
   * 초기 UI 상태 설정
   * @private
   */
  _setInitialUIState() {
    // 검색 결과 초기화
    uiModule.updateSearchResult(
      STORAGE_KEYS.SEARCH_RESULTS,
      0,
      "#searchResult"
    );
    uiModule.updateSearchResult(STORAGE_KEYS.EXIST_ID_LISTS, 1, "#sentIdList");

    // 기본 탭 활성화
    $("#searchTab").tab("show");
  },
};

// 페이지 로드 완료 후 애플리케이션 초기화
$(document).ready(() => {
  app.init();
});

export default app;
