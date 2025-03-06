const BASE_URL = ""; // 서버의 기본 URL

export const ENDPOINTS = {
  // 검색 관련
  SEARCH: `${BASE_URL}/api/search`,
  SUPER_IDS: `${BASE_URL}/api/superIds`,

  // 발송자 관련
  SENDER_LIST: `${BASE_URL}/db/getSender`,
  SENDER_ONE: `${BASE_URL}/db/getOneSender/:id`,
  UPDATE_SENDER: `${BASE_URL}/db/changeSenderName/:no`,
  ADD_SENDER_MAIL: `${BASE_URL}/db/addSenderMail`,
  DELETE_SENDER: `${BASE_URL}/db/deleteSender/:senderEmail`,

  // 메일 발송 관련
  SEND_TEST: `${BASE_URL}/api/sendTest`,
  SEND_MAIL: `${BASE_URL}/api/sendMail`,

  // 템플릿 관련
  GET_HTML_TEMPLATE_ALL: `${BASE_URL}/db/getSenderTemplateAll`,
  SET_HTML_TEMPLATE: `${BASE_URL}/db/setHtmlTemplate`,
  CHECK_HTML_TEMPLATE: `${BASE_URL}/db/checkHtmlTemplate/:senderId/:templateName`,
  DELETE_HTML_TEMPLATE: `${BASE_URL}/db/deleteHtmlTemplate/:senderId/:templateName`,
  UPDATE_HTML_TEMPLATE: `${BASE_URL}/db/updateHtmlTemplate`,
  GET_FILTER_TEMPLATE_ALL: `${BASE_URL}/db/getFilterTemplateAll`,

  // 키워드 관련
  GET_KEYWORD: `${BASE_URL}/db/getKeyWord/:senderId`,
  INSERT_KEYWORD: `${BASE_URL}/db/insertKeyWord`,
  DELETE_KEYWORD: `${BASE_URL}/db/deleteKeyWord/:no`,
  DELETE_KEYWORD_LIST: `${BASE_URL}/db/deleteKeyWordList/:noList`,

  // 기타
  TIME_ZONE: `${BASE_URL}/db/getAllowedTimeZone`,
  BLACKLIST: `${BASE_URL}/db/addBlackList`,
  AGENT_LIST: `${BASE_URL}/db/getSenderEmails`,
  MAIL_GROUP_STATE: `${BASE_URL}/db/getMailGroupState`,
  SEND_LIST_CLEAR: `${BASE_URL}/db/sendListClear/:senderId`,
  SOCKET_SERVER: "",
};

export default ENDPOINTS;
