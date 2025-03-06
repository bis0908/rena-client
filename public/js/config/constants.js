// 세션 스토리지 키
export const STORAGE_KEYS = {
  SEARCH_RESULTS: "searchResults",
  EXIST_ID_LISTS: "existIdLists",
  SENDER_EMAIL: "senderEmail",
  KEYWORD: "keyword",
};

// 상태 플래그
export const FLAG = {
  YES: "Y",
  NO: "N",
};

// UI 요소 선택자
export const SELECTORS = {
  TAB_LINKS: ".nav-link",
  ID_SEARCH_RESULT: "#searchResult",
  SENT_ID_LIST: "#sentIdList",
  SENDER_ID_LIST: "#senderIdList",
  SENDER_TOTAL_LIST: ".mail-control",
};

// 텍스트 상수
export const TEXT = {
  DIVIDER: "  |  ",
};

// 정규식
export const REGEX = {
  LINK: /(<a[^>]*>)(.*<\/a>)/gm,
};

// Quill 에디터 설정
export const EDITOR_CONFIG = {
  toolbar: [
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
  ],
};
