export const SUCCESS_MESSAGES = {
  SENDER_ADDED: "발송자가 성공적으로 추가되었습니다.",
  SENDER_UPDATED: "발송자 정보가 업데이트되었습니다.",
  SENDER_DELETED: "발송자가 삭제되었습니다.",
  TEMPLATE_SAVED: "템플릿이 저장되었습니다.",
  MAIL_SENT: "메일이 성공적으로 발송되었습니다.",
  TEST_MAIL_SENT: "테스트 메일이 발송되었습니다.",
};

export const ERROR_MESSAGES = {
  SENDER_REQUIRED: "발송자를 선택해주세요.",
  RECIPIENT_REQUIRED: "수신자를 입력해주세요.",
  SUBJECT_REQUIRED: "제목을 입력해주세요.",
  CONTENT_REQUIRED: "내용을 입력해주세요.",
  INVALID_EMAIL: "유효하지 않은 이메일 주소입니다.",
  CONNECTION_ERROR: "서버 연결에 실패했습니다. 다시 시도해주세요.",
  TEMPLATE_EXISTS: "동일한 이름의 템플릿이 이미 존재합니다.",
};

export const CONFIRM_MESSAGES = {
  DELETE_SENDER: "이 발송자를 삭제하시겠습니까?",
  DELETE_TEMPLATE: "이 템플릿을 삭제하시겠습니까?",
  SEND_MAIL: "메일을 발송하시겠습니까?",
  CLEAR_LIST: "목록을 비우시겠습니까?",
};

export const createSenderActionMessage = (senderEmail, senderName, action) =>
  `${senderEmail} 계정이 발송기 [${senderName}] 에서 ${action} 되었습니다.`;
