let table;
let quill3;
let toolbarOptions2;
let $clickedElement;
let groupNo = null;
let groupName = null;

const createBadgeForSenderEmail = (name, agent_no) =>
  `<span class="badge agent-badge text-bg-warning bg-opacity-50 text-opacity-75 ms-2" data-agent=${agent_no}>${name}</span>`;

// Initialize the DataTable
function initDataTables() {
  table = $("#delivery-table").DataTable({
    initComplete: function () {
      // https://datatables.net/examples/api/api_in_init.html
      this.api()
        .columns()
        .every(function (idx) {
          if (idx < 2) {
            let that = this;
            let input = $("input", this.footer());
            input.on("keyup change clear", function () {
              if (that.search() !== this.value) {
                that.search(this.value).draw();
              }
            });
          }
        });
    },
    autoWidth: true,
    paging: true,
    language: { lengthMenu: "Display _MENU_", searchPlaceholder: "검색" } /*
    l: length changing input control (페이지 크기 조절 버튼)
    r: processing display element (데이터 처리 중임을 나타내는 요소)
    t: table (테이블 요소)
    i: Table information summary (테이블 정보 요약)
    p: pagination control (페이지 전환 버튼)
    float-end: 버튼을 오른쪽에 정렬
    f: 검색 기능 (테이블 위에 검색 창을 제공)
     */,
    dom: `
            <'row'
              <'d-flex justify-content-between' lf>
            >
            <'row'
              t
            >
            <'row'
              <'d-flex justify-content-between' ip>
            >
          `,
    responsive: {
      details: {
        type: "inline", // target: "tr",
      },
    },
    columns: [
      {
        title: "No",
        render: function (data, type, row, meta) {
          return row.no;
        },
        width: "2%",
      },
      {
        title: "발송 그룹",
        render: (data, type, row) => {
          const name = row.name;
          const no = row.no;
          const remains = Number(row.remains);
          const groupName = `
            <div class="col-sm-12 col-md-7 col-lg-6 align-self-center g-0">
              ${name}
            </div>`;

          const linkSet = `
            <a href="/mail-delivery-schedule-v2?groupNum=${
              row.sender_group
            }&groupName=${name}" target="_blank" class="btn btn-info btn-sm" role="button" rel="noopener noreferrer">상세</a>
            <button class="btn btn-sm btn-warning mail-detail" data-no=${no}>내용</button>
            <button class="btn btn-sm btn-danger delete-group" data-no=${no} data-group=${row.name?.replaceAll(
            " ",
            ""
          )}>삭제</button>`;

          let buttonClass = "btn btn-sm ";
          let groupStatusBtnText;

          if (remains === 0) {
            // 해당 메일 그룹 모두 발송 되었을 경우
            buttonClass += "btn-dark mail-suspend";
            groupStatusBtnText = "완료";
          } else {
            // 해당 메일 그룹 발송 중일 경우
            if (row.group_suspend === "N") {
              // 현재 발송중, 중지 가능
              buttonClass += "btn-dark mail-suspend";
              groupStatusBtnText = "정지";
            } else {
              // 현재 정지 중, 재개 가능
              buttonClass += "btn-success mail-reopen";
              groupStatusBtnText = "재개";
            }
          }

          const buttonHtml = `
            <button class="${buttonClass}" data-no=${no} data-group=${row.name?.replaceAll(
            " ",
            ""
          )} ${remains === 0 ? "disabled" : ""}>
              ${groupStatusBtnText}
            </button>`;

          return `
            <div class="container text-center">
              <div class="row d-flex justify-content-center">
                ${groupName}
                <div class="col-sm-12 col-md-3 col-lg-5 g-0">
                  ${linkSet}
                  ${buttonHtml}
                </div>
              </div>
            </div>`;
        },
        width: "25%",
      },
      {
        title: "발송 완료 / 전체 발송",
        render: function (data, type, row) {
          const deliveryCompleted = Number(row.delivery_completed);
          const totalDeliveries = Number(row.total_deliveries);
          const ratio = (deliveryCompleted / totalDeliveries) * 100;
          return `
              <span>${deliveryCompleted} / ${totalDeliveries}</span><span> (${ratio.toFixed(
            1
          )}%)</span>`;
        },
        width: "13%",
      }, // {
      //   title: "발송 완료",
      //   data: "delivery_completed",
      //   width: "13%",
      // },
      {
        title: "발송 실패",
        data: "delivery_failed",
        render: function (data, type, row) {
          return row.delivery_failed > 0
            ? `<div class="d-flex justify-content-around align-items-center">
              <div class="text-danger fw-bold">${row.delivery_failed}</div>
              <button class="btn btn-outline-danger btn-sm get-error-list" data-group=${
                row.no
              } data-group-name=${row.name.replace(" ", "")}>오류 목록</button>
            </div>`
            : row.delivery_failed;
        },
        width: "10%",
      },
      {
        title: "메일 읽음 / 발송 성공",
        render: function (data, type, row) {
          const readMail = Number(row.read_mail);
          const deliveryCompleted = Number(row.delivery_completed);
          const percentage = (
            (deliveryCompleted !== 0 ? readMail / deliveryCompleted : 0) * 100
          ).toFixed(1);
          return (
            readMail + " / " + deliveryCompleted + " (" + percentage + "%)"
          );
        },
        width: "10%",
      },
    ],
    createdRow: function (row, data, dataIndex) {
      $(row)
        .find("td")
        .css({ "vertical-align": "middle", "text-align": "center" });
    },
    order: [],
  });
}

$(document).ready(function () {
  try {
    // getMailGroupState();
    getTodaySentGroup();
  } catch (error) {
    console.error(error);
  }

  $("#delivery-table_wrapper")
    .find(".dt-buttons")
    .addClass("justify-content-end");
});

$(document).on("click", ".mail-detail", function () {
  const no = $(this).data("no");
  try {
    const $suspendButton = $(`.mail-suspend[data-no=${no}]`);
    const isSuspendButtonDisabled = $suspendButton.attr("disabled");
    const editButtonHtml = `
      <button type="button" class="btn btn-primary edit-mail-contents" data-no=${no}>수정</button>
    `;
    if (!isSuspendButtonDisabled) {
      $("#detailsModal .modal-footer").prepend(editButtonHtml);
    }
    getMailGroupStateDetail(no);
  } catch (error) {
    console.error(error);
  }
});

$(document).on("click", "#detailsModal .edit-mail-contents", function () {
  const mailTitle = $("#detailsModalLabel").text();
  const mailContent = $("#modalContent").html();
  $("#modalContent").html("");
  // reset each html
  $("#detailsModalLabel").html(
    `<textarea type='text' class='form-control' id="edit-template-title" rows='2'>${mailTitle}</textarea>`
  );

  $("#modalContent").append('<div id="editor3"></div>');

  const block = Quill.import("blots/block");
  block.tagName = "div";
  Quill.register(block, true);

  // configure Quill to use inline styles so the email's format properly
  const DirectionAttribute = Quill.import("attributors/attribute/direction");
  Quill.register(DirectionAttribute, true);

  const AlignClass = Quill.import("attributors/class/align");
  Quill.register(AlignClass, true);

  const BackgroundClass = Quill.import("attributors/class/background");
  Quill.register(BackgroundClass, true);

  const ColorClass = Quill.import("attributors/class/color");
  Quill.register(ColorClass, true);

  const DirectionClass = Quill.import("attributors/class/direction");
  Quill.register(DirectionClass, true);

  const FontClass = Quill.import("attributors/class/font");
  Quill.register(FontClass, true);

  const SizeClass = Quill.import("attributors/class/size");
  Quill.register(SizeClass, true);

  const AlignStyle = Quill.import("attributors/style/align");
  Quill.register(AlignStyle, true);

  const BackgroundStyle = Quill.import("attributors/style/background");
  Quill.register(BackgroundStyle, true);

  const ColorStyle = Quill.import("attributors/style/color");
  Quill.register(ColorStyle, true);

  const DirectionStyle = Quill.import("attributors/style/direction");
  Quill.register(DirectionStyle, true);

  const FontStyle = Quill.import("attributors/style/font");
  Quill.register(FontStyle, true);

  const SizeStyle = Quill.import("attributors/style/size");
  Quill.register(SizeStyle, true);

  toolbarOptions2 = [
    [{ font: [] }],
    // [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ align: [] }],
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image", "video", "formula"], // custom button values
    // [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction
    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    ["clean"], // remove formatting button
  ];

  quill3 = new Quill("#editor3", {
    modules: {
      toolbar: toolbarOptions2,
    },
    placeholder: "메일 내용을 작성해주세요",
    theme: "snow",
  });

  quill3.root.innerHTML = mailContent;

  $(".edit-mail-contents").addClass("visually-hidden");
  $("#save-current-contents").removeClass("visually-hidden");
});

$(document).on("click", "#save-current-contents", function () {
  const no = $(".edit-mail-contents").data("no");
  const mailTitle = $("#edit-template-title").val().trim();
  const mailContent = quill3.root.innerHTML;

  if (mailTitle !== "" && mailContent !== "") {
    $.post(
      "/db/updateMailContents",
      { no, mailTitle, mailContent },
      function (data, textStatus, jqXHR) {
        if (data.isSuccess) {
          alert("메일 내용이 수정되었습니다.");
          // $("#detailsModal").modal("hide");
          quill3 = null;
          $("#editor3").remove();

          $("#detailsModalLabel").text(mailTitle);
          $("#modalContent").html(mailContent);

          $(".edit-mail-contents").removeClass("visually-hidden");
          $("#save-current-contents").addClass("visually-hidden");
        }
      },
      "json"
    );
    $(".edit-mail-contents").removeClass("visually-hidden");
    $("#save-current-contents").addClass("visually-hidden");
  } else {
    alert("제목이나 내용을 확인해주세요.");
  }
});

$("#detailsModal").on("hidden.bs.modal", function () {
  if ($(".edit-mail-contents").length > 0) {
    $(".edit-mail-contents").remove();
  }
  $("#modalContent").empty();
  $("#save-current-contents").addClass("visually-hidden");
  $("#sendWithoutChange").addClass("visually-hidden");
});

$(document).on("click", ".delete-group", function () {
  const no = $(this).data("no");
  const groupname = $(this).data("group");
  const $clickedElement = $(this);
  if (confirm(`그룹 '${groupname}'을 삭제하시겠습니까?`)) {
    $.post(
      "/db/deleteGroup",
      { no },
      function (data, textStatus, jqXHR) {
        if (data.isSuccess) {
          // remove current row
          $clickedElement.closest("tr").remove();
        } else {
          alert("그룹 삭제 실패");
        }
      },
      "json"
    ).fail(function () {
      alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    });
  }
});

$(document).on("click", ".mail-suspend", function () {
  const no = $(this).data("no");
  const groupname = $(this).data("group");
  const $clickedElement = $(this);
  if (confirm(`그룹 '${groupname}'을 발송 정지하시겠습니까?`)) {
    showLoading();
    $.post(
      "/db/suspendGroup",
      { no },
      function (data, textStatus, jqXHR) {
        if (data.isSuccess) {
          $clickedElement.removeClass("btn-dark mail-suspend");
          $clickedElement.addClass("btn-success mail-reopen");
          $clickedElement.text("재개");
        } else {
          $clickedElement.removeClass("btn-dark mail-suspend");
          $clickedElement.addClass("btn-success mail-done disabled");
          $clickedElement.text("완료");
          alert(data.message);
        }
        hideLoading();
      },
      "json"
    );
  }
});

// ajax for getErrorMessageSummary(groupNo)
$(document).on("click", ".get-error-list", async function () {
  const groupNo = $(this).data("group");
  const groupName = $(this).data("group-name");
  try {
    showLoading();
    const queryObjArr = await getErrorMessageSummary(groupNo);
    // let groupedErrors;

    // 에러 메시지를 유형별로 그룹화
    // 에러 메시지를 유형별로 그룹화
    const groupedErrors = queryObjArr.reduce((acc, { err }) => {
      const [errorType, errorDetail] = err.split(': ');
      if (!acc[errorType]) {
        acc[errorType] = [];
      }
      acc[errorType].push(errorDetail);
      return acc;
    }, {});

    // 가장 많은 오류를 포함한 유형 찾기
    let maxErrorCount = 0;
    let maxErrorType = "";
    Object.entries(groupedErrors).forEach(([errorType, errors]) => {
      if (errors.length > maxErrorCount) {
        maxErrorCount = errors.length;
        maxErrorType = errorType;
      }
    });

    // 아코디언 컴포넌트 생성
    let accordionHtml = '<div class="accordion" id="errorAccordion">';
    Object.entries(groupedErrors).forEach(([errorType, errors], index) => {
      const isMaxErrorType = errorType === maxErrorType;
      accordionHtml += `
        <div class="accordion-item">
          <h2 class="accordion-header" id="heading${index}">
            <button class="accordion-button ${
              isMaxErrorType ? "" : "collapsed"
            }" type="button" data-bs-toggle="collapse" 
                    data-bs-target="#collapse${index}" aria-expanded="${
        isMaxErrorType ? "true" : "false"
      }" 
                    aria-controls="collapse${index}">
              ${errorType} (${errors.length}개)
            </button>
          </h2>
          <div id="collapse${index}" class="accordion-collapse collapse ${
        isMaxErrorType ? "show" : ""
      }" 
               aria-labelledby="heading${index}" data-bs-parent="#errorAccordion">
            <div class="accordion-body">
              <ol>
                ${errors.map((error) => `<li>${error}</li>`).join("")}
              </ol>
            </div>
          </div>
        </div>
      `;
    });
    accordionHtml += "</div>";

    $("#errorListModalLabel").text(groupNo + "  |  " + groupName);
    $("#err-list").html(accordionHtml);
    $("#errorListModal").modal("show");
  } catch (error) {
    console.error(error);
  } finally {
    hideLoading();
  }
});

// when modal is closed, clear the error list
$("#errorListModal").on("hidden.bs.modal", function () {
  $("#err-list").empty();
});

// ajax for getErrorMessageSummary(groupNo)
function getErrorMessageSummary(groupNo) {
  return new Promise((resolve, reject) => {
    $.post(
      "/db/getErrorMessageSummary",
      { groupNo },
      function (data, textStatus, jqXHR) {
        if (data.isSuccess) {
          hideLoading();
          resolve(data.data);
        }
      },
      "json"
    ).fail(function (jqXHR, textStatus, errorThrown) {
      reject(errorThrown);
    });
  });
}

// as-is
/*$(document).on("click", ".mail-reopen", function () {
  const no = $(this).data("no");
  const groupName = $(this).data("group");
  const $clickedElement = $(this);
  if (confirm(`그룹 '${groupName}'을 발송 재개하시겠습니까?`)) {
    showLoading();
    $.post("/db/reopenGroup", { no }, function (data, textStatus, jqXHR) {
      if (data.isSuccess) {
        // change text and class
        $clickedElement.removeClass("btn-success mail-reopen");
        $clickedElement.addClass("btn-dark mail-suspend");
        $clickedElement.text("정지");
        hideLoading();
      }
    }, "json");
  }
});*/

let currentEmail;
// to-be
$(document).on("click", ".mail-reopen", async function () {
  groupNo = $(this).data("no");
  groupName = $(this).data("group");
  $clickedElement = $(this);
  $.post(
    "/db/getThisGroupsSender",
    { groupNo },
    function (data, textStatus, jqXHR) {
      currentEmail = data.data[0]?.email;
      $("#detailsModalLabel").text(
        `대체 발송할 메일 계정 선택 (현재: ${currentEmail})`
      );
    }
  );
  getSenderEmails();
  const mailAllocationStatus = await getCurrentMailAllocationStatus();
  if (mailAllocationStatus.length > 0) {
    setTimeout(() => {
      $(".modal-body button").each(function () {
        // const mailNo = $(this).attr("id").split("-")[1].trim();
        const mailNo = $(this).data("no");
        mailAllocationStatus.forEach((dataSet) => {
          if (mailNo == dataSet.mail_no) {
            const badge = createBadgeForSenderEmail(
              dataSet.name,
              dataSet.agent_no
            );
            // $(this).parent().append(badge);
            $(this).append(badge);
          }
        });
      });
    }, 100);
  }
  $("#sendWithoutChange").removeClass("visually-hidden");
  $("#detailsModal").modal("show");
});

$(document).on("click", "#modalContent .list-group-item", function () {
  const targetMail = $(this)
    .contents()
    .filter(function () {
      return this.nodeType === Node.TEXT_NODE;
    })
    .text()
    .trim();
  const message = `'${targetMail}'으로 발송 재개를 수행합니다.\n계속하시겠습니까?`;
  if (confirm(message)) {
    $("#detailsModal").modal("hide");
    showLoading();
    // step 1 change sender email
    if (currentEmail !== targetMail) {
      $.post(
        "/db/changeSenderEmail",
        { groupNo, targetMail },
        function (data, textStatus, jqXHR) {
          if (data.isSuccess) {
            console.log("발송 메일 계정 변경됨");
          }
        },
        "json"
      );
    }
    $.post(
      "/db/reopenGroup",
      { groupNo },
      function (data, textStatus, jqXHR) {
        if (data.isSuccess) {
          $clickedElement.removeClass("btn-success mail-reopen");
          $clickedElement.addClass("btn-dark mail-suspend");
          $clickedElement.text("정지");
          alert("발송이 재개되었습니다.");
          hideLoading();
          groupNo = null;
          groupName = null;
        }
      },
      "json"
    );
  }
});

$("#sendWithoutChange").on("click", function () {
  console.log(groupNo);
  if (!groupNo) {
    return alert("그룹 정보를 찾을 수 없습니다.");
  }
  if (confirm(`그룹 '${groupName}'이 발송메일 변경 없이\n재개하시겠습니까?`)) {
    $("#detailsModal").modal("hide");
    showLoading();
    $.post(
      "/db/reopenGroup",
      { groupNo },
      function (data, textStatus, jqXHR) {
        if (data.isSuccess) {
          // change text and class
          $clickedElement.removeClass("btn-success mail-reopen");
          $clickedElement.addClass("btn-dark mail-suspend");
          $clickedElement.text("정지");
          hideLoading();
          groupNo = null;
          groupName = null;
        }
      },
      "json"
    );
  }
});

function getSenderEmails() {
  $.ajax({
    type: "post",
    url: "/db/getSenderEmails",
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        senderEmailTotal = response.data;
        const senderEmailList = generateSenderEmailList(senderEmailTotal);
        $("#modalContent").append(senderEmailList);
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
    },
  });
}

function generateSenderEmailList(senderEmails, insertId) {
  let list = "<div class='list-group'>";
  const sortedEmails = Array.isArray(senderEmails)
    ? senderEmails.sort((a, b) => a.id.localeCompare(b.id))
    : [];

  if (sortedEmails.length > 0) {
    sortedEmails.forEach((senderEmail) => {
      list += `<button type="button" class="list-group-item list-group-item-action" data-no="${senderEmail.no}">${senderEmail.id}</button>`;
    });
    list += "</div>";
  }
  return list;
}

function getCurrentMailAllocationStatus() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "post",
      url: "/db/getCurrentMailAllocationStatus",
      dataType: "json",
      success: function (response) {
        if (response.isSuccess) {
          resolve(response.data);
        }
      },
      error: (xhr, status, error) => {
        console.error(xhr);
        console.error(status);
        console.error(error.message);
        reject(error);
      },
    });
  });
}
