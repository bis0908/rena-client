let table;
let quill3;
let toolbarOptions2;
let $clickedElement;
let groupNo = null;
let groupName = null;

// 상수 정의
const BADGE_STYLE = "badge agent-badge text-bg-warning bg-opacity-50 text-opacity-75 ms-2";
const MODAL_SETTINGS = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

// 유틸리티 함수
const createBadgeForSenderEmail = (name, agent_no) =>
  `<span class="${BADGE_STYLE}" data-agent=${agent_no}>${name}</span>`;

// DataTable 초기화 및 설정
function initDataTables() {
  const columnConfig = getColumnConfig();
  const tableSettings = getTableSettings(columnConfig);
  
  table = $("#delivery-table").DataTable(tableSettings);
  
  // 검색 기능 초기화
  initializeSearch(table);
}

function getColumnConfig() {
  return [
    {
      title: "No",
      render: (data, type, row, meta) => row.no,
      width: "2%",
    },
    {
      title: "발송 그룹",
      render: createGroupColumn,
      width: "25%",
    },
    // ... 다른 컬럼 설정
  ];
}

function getTableSettings(columns) {
  return {
    initComplete: function() {
      this.api()
        .columns()
        .every(function(idx) {
          if (idx < 2) {
            initializeColumnSearch(this);
          }
        });
    },
    autoWidth: true,
    paging: true,
    language: { 
      lengthMenu: "Display _MENU_", 
      searchPlaceholder: "검색" 
    },
    dom: getTableDomStructure(),
    responsive: {
      details: {
        type: "inline",
      },
    },
    columns: columns,
  };
}

function createGroupColumn(data, type, row) {
  const groupName = createGroupNameSection(row);
  const linkSet = createLinkSetSection(row);
  const statusButton = createStatusButton(row);

  return `
    <div class="container text-center">
      <div class="row d-flex justify-content-center">
        ${groupName}
        <div class="col-sm-12 col-md-3 col-lg-5 g-0">
          ${linkSet}
          ${statusButton}
        </div>
      </div>
    </div>`;
}

// 이벤트 핸들러
$(document).on("click", "#modalContent .list-group-item", async function() {
  const targetMail = getTargetMail(this);
  if (await confirmMailChange(targetMail)) {
    await handleMailChange(targetMail);
  }
});

$("#sendWithoutChange").on("click", async function() {
  if (!validateGroupInfo()) return;
  
  if (await confirmReopenGroup()) {
    await reopenMailGroup();
  }
});

// API 호출 함수
async function getSenderEmails() {
  try {
    const response = await $.ajax({
      type: "post",
      url: "/db/getSenderEmails",
      dataType: "json",
    });
    
    if (response.isSuccess) {
      handleSenderEmailsResponse(response.data);
    }
  } catch (error) {
    console.error("Failed to fetch sender emails:", error);
    throw error;
  }
}

async function getCurrentMailAllocationStatus() {
  try {
    const response = await $.ajax({
      type: "post",
      url: "/db/getCurrentMailAllocationStatus",
      dataType: "json",
    });
    
    return response.isSuccess ? response.data : [];
  } catch (error) {
    console.error("Failed to fetch mail allocation status:", error);
    throw error;
  }
}
