import { ENDPOINTS } from "./api.js";
import { showToast } from "../utils/helpers.js";
import { uiModule } from "../modules/ui.js";
import { senderModule } from "../modules/sender.js";
import { keywordModule } from "../modules/keyword.js";
import { templateModule } from "../modules/template.js";

/**
 * 소켓 서비스 - 실시간 통신 관리
 */
export const socketService = {
  // 상태
  socket: null,
  isConnected: false,
  listeners: {},

  /**
   * 소켓 서비스 초기화
   * @returns {void}
   */
  init() {
    this._connect();
    return this;
  },

  /**
   * 소켓 연결
   * @private
   */
  _connect() {
    try {
      this.socket = io(ENDPOINTS.SOCKET_SERVER, {
        path: "/socket.io",
        transports: ["websocket"],
      });

      this.socket.on("connect", () => {
        console.log("Socket connected");
        this.isConnected = true;

        if (this.socket.connected) {
          // 소켓 연결 표시
          $("#socketStatus").removeClass("bg-danger").addClass("bg-success");
          $("#socketText").text("연결됨");
        }

        // connect 이벤트 발생
        this._trigger("connect");
      });

      this.socket.on("disconnect", () => {
        console.log("Socket disconnected");
        this.isConnected = false;

        // 소켓 연결 해제 표시
        $("#socketStatus").removeClass("bg-success").addClass("bg-danger");
        $("#socketText").text("연결 끊김");

        // disconnect 이벤트 발생
        this._trigger("disconnect");
      });

      this.socket.on("connect_error", (err) => {
        console.log("Socket connection error:", err);
        this.isConnected = false;

        // 소켓 연결 에러 표시
        $("#socketStatus").removeClass("bg-success").addClass("bg-danger");
        $("#socketText").text("연결 오류");

        // error 이벤트 발생
        this._trigger("error", err);
      });

      // 기본 이벤트 리스너 설정
      this._setupEventListeners();
    } catch (error) {
      console.error("Error setting up socket:", error);
    }
  },

  /**
   * 기본 이벤트 리스너 설정
   * @private
   */
  _setupEventListeners() {
    // 이메일 상태 변경 이벤트 (할당/해제)
    this.socket.on("getEmailStateChanged", (data) => {
      console.log("Email state changed:", data);
      this._trigger("emailStateChanged", data);
    });

    // 새 발송자 이메일 추가
    this.socket.on("newSenderEmail", (data) => {
      console.log("New sender email:", data);
      this._trigger("newSenderEmail", data);
    });

    // 모든 발송자 이메일 해제
    this.socket.on("unassignAll", () => {
      console.log("Unassign all emails");
      this._trigger("unassignAll");
    });

    // 발송자 삭제
    this.socket.on("deleteSender", (email) => {
      console.log("Delete sender:", email);
      this._trigger("deleteSender", email);
    });

    // 에이전트 이름 변경
    this.socket.on("renameAgent", (data) => {
      console.log("Rename agent:", data);
      this._trigger("renameAgent", data);
    });

    // 키워드 업데이트 이벤트
    this.socket.on("keywordUpdated", (data) => {
      console.log("Keyword updated:", data);
      this._trigger("keywordUpdated", data);
    });

    // 템플릿 업데이트 이벤트
    this.socket.on("templateUpdated", (data) => {
      console.log("Template updated:", data);
      this._trigger("templateUpdated", data);
    });

    // 메일 발송 상태 업데이트
    this.socket.on("mailSent", (data) => {
      console.log("Mail sent:", data);
      this._trigger("mailSent", data);
    });

    // 에러 메시지
    this.socket.on("error", (data) => {
      console.error("Socket error:", data);
      this._trigger("socketError", data);
    });

    // 긴급 모드 업데이트
    this.socket.on("emergencyModeUpdated", (data) => {
      console.log("Emergency mode updated:", data);
      this._trigger("emergencyModeUpdated", data);
    });
  },

  /**
   * 이벤트 리스너 등록
   * @param {string} eventName - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @returns {socketService} - 체이닝을 위한 인스턴스 반환
   */
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(callback);
    return this;
  },

  /**
   * 내부 이벤트 발생시키기
   * @private
   * @param {string} eventName - 이벤트 이름
   * @param {*} data - 이벤트 데이터
   */
  _trigger(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((callback) => {
        callback(data);
      });
    }
  },

  /**
   * 이벤트 리스너 제거
   * @param {string} eventName - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   * @returns {socketService} - 체이닝을 위한 인스턴스 반환
   */
  off(eventName, callback) {
    if (this.listeners[eventName]) {
      if (callback) {
        this.listeners[eventName] = this.listeners[eventName].filter(
          (cb) => cb !== callback
        );
      } else {
        delete this.listeners[eventName];
      }
    }
    return this;
  },

  /**
   * 소켓 이벤트 발송
   * @param {string} eventName - 이벤트 이름
   * @param {*} data - 이벤트 데이터
   * @returns {socketService} - 체이닝을 위한 인스턴스 반환
   */
  emit(eventName, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(eventName, data);
    } else {
      console.warn("Cannot emit event: socket is not connected");
    }
    return this;
  },

  /**
   * 소켓 연결 해제
   * @returns {void}
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};

export default socketService;
