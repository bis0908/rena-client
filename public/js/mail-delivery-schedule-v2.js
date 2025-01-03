// 상수 정의
const STATUS_BADGES = {
  immediately: { class: "secondary", text: "즉시 발송" },
  scheduled: { class: "primary", text: "예약" },
  sending: { class: "warning", text: "발송중" },
  finished: { class: "success", text: "발송 완료" },
  failed: { class: "danger", text: "발송 실패" },
  rejected: { class: "dark", text: "발송 차단" },
  default: { class: "info", text: "init" },
};

// 테이블 설정
const TABLE_COLUMNS = [
  {
    title: "수집ID",
    data: "collection_id",
  },
  {
    title: "발송 등록",
    data: null,
    render: (data, type, row) => formatDate(row.dispatch_registration_time),
  },
  {
    title: "발송 시작",
    data: null,
    render: (data, type, row) =>
      row.send_start_time === null
        ? "발송 대기중"
        : formatDate(row.send_start_time),
  },
  {
    title: "발송 완료",
    data: null,
    render: (data, type, row) =>
      row.dispatch_finish_time === null
        ? "미정"
        : formatDate(row.dispatch_finish_time),
  },
  {
    title: "발송 예약",
    data: "reservation_sent",
    width: "10%",
  },
  {
    title: "발송 상태",
    width: "10%",
    render: (data, type, row) => createStatusBadge(row),
  },
  {
    title: "읽음",
    data: "mail_read_status",
    width: "10%",
  },
];

// 상태 뱃지 생성 함수
function createStatusBadge(row) {
  const status = STATUS_BADGES[row.send_status] || STATUS_BADGES.default;
  const tooltipAttr =
    row.send_status === "failed"
      ? `data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip"
       data-bs-placement="top"
       data-bs-delay='{"show":"0", "hide":"1000"}'
       title="${row.error_message}"`
      : "";

  return `<h5><span class="badge text-bg-${status.class}" ${tooltipAttr}>${status.text}</span></h5>`;
}

// 테이블 초기화
function initializeTable(groupName) {
  $(".headers").prepend(`
    <h5 style="align-self: center;">
      <i class="bi bi-people-fill">  ${groupName}</i>
    </h5>
  `);

  return $("#delivery-table").DataTable({
    initComplete: initializeColumnSearch,
    drawCallback: initializeTooltips,
    autoWidth: true,
    paging: true,
    responsive: {
      details: { type: "inline" },
    },
    dom: createTableDomStructure(),
    columns: TABLE_COLUMNS,
    createdRow: (row, data, dataIndex) => {
      $(row)
        .find("td")
        .css({ "vertical-align": "middle", "text-align": "center" });
    },
    order: [],
  });
}

// 검색 기능 초기화
function initializeColumnSearch() {
  this.api()
    .columns()
    .every(function () {
      let that = this;
      let input = $("input", this.footer());
      input.on("keyup change clear", function () {
        if (that.search() !== this.value) {
          that.search(this.value).draw();
        }
      });
    });
}

// 툴팁 초기화
function initializeTooltips() {
  let tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// 테이블 DOM 구조 생성
function createTableDomStructure() {
  return `
    <'row'<'d-flex justify-content-between' lf>>
    <'row't>
    <'row'<'d-flex justify-content-between' ip>>
  `;
}

// 메인 초기화
$(() => {
  console.log("schedule-v2");
  const params = new URLSearchParams(window.location.search);
  const groupNum = params.get("groupNum");
  const groupName = params.get("groupName");

  const table = initializeTable(groupName);
  getMailStateDetail(groupNum);

  // 입력 필드 너비 업데이트
  function updateInputWidths() {
    table.columns().every(function () {
      let columnWidth = $(this.header()).width();
      let input = $("input", this.footer());
      input.css("width", columnWidth + "px");
    });
  }

  table.on("init.dt", updateInputWidths);
  $(window).on("resize", updateInputWidths);
});
