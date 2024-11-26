/* let timeZ;
let dateTimeValue;

$(document).ready(function () {
  showLoading();
  setTimeout(() => {
    fetchMailDeliverySchedule();
  }, 500);

  function resizeFonts() {
    if ($(window).width() < 800) {
      $("table").addClass("table-sm");
    } else {
      $("table").removeClass("table-sm");
    }
  }

  // Call the function on initial load
  resizeFonts();

  // Call the function when the window is resized
  $(window).resize(resizeFonts);
});

let allData = [];

function fetchMailDeliverySchedule() {
  $.post("/db/mailDeliverySchedule", (data) => {
    allData = data;
    // console.log("data: ", data);
    renderPage(1, 10);
  }).fail(() => {
    alert("Failed to fetch mail delivery schedule data.");
  });
}

function renderTableRow(row, totalRowCount, startIndex, index) {
  const rowNumber = totalRowCount - (startIndex + index);
  const dispatch_reg_time = formatDate(row.dispatch_registration_time);
  const sendStartTime = formatDate(row.send_start_time);
  const editButton =
    row.reservation_sent === "Y" && row.send_status !== "finished" && row.send_status !== "failed"
      ? `<button class="btn btn-secondary btn-sm" onclick="editSendStartTime(${row.no}, '${dispatch_reg_time}')">Edit</button>`
      : "";
  // const keyword = row.keyword;
  // const email = JSON.parse(row.collection_id);
  const mail_title = row.mail_title;
  // const dataUrl = JSON.parse(row.dataUrl);

  // Generate badge based on send status
  let statusBadge = "";
  switch (row.send_status) {
    case "scheduled":
      statusBadge = '<h5><span class="badge bg-primary">Scheduled</span></h5>';
      break;

    case "sending":
      statusBadge = '<h5><span class="badge bg-info">Sending</span></h5>';
      break;

    case "finished":
      statusBadge = '<h5><span class="badge bg-success">Finished</span></h5>';
      break;

    case "failed":
      statusBadge = '<h5><span class="badge bg-danger">Failed</span></h5>';
      break;

    default:
      break;
  }

  return `
    <tr>
      <td class="col-no">${rowNumber}</td>
      <td class="col-sender-no">${row.mail_agent}</td>
      <td class="col-collection-id">${row.collection_id}</td>
      <td class="col-sender-name">${row.sender_name}</td>
      <td class="col-sender-group">${row.sender_group}</td>
      <td class="col-title">${mail_title}</td>
      <td class="col-body">
        <button class="btn btn-primary btn-sm view-btn" data-row-number="${rowNumber}" data-body-content="${
    row.body_content
  }">View</button>
      </td>
      <td class="col-dispatch-registration-time">${formatDate(
        row.dispatch_registration_time
      )} ${editButton}</td>
      <td class="col-send-start-time">${sendStartTime} </td>
      <td class="col-dispatch-finish-time">${formatDate(row.dispatch_finish_time)}</td>
      <td class="col-reservation-sent">${row.reservation_sent}</td>
      <td class="col-send-status">${statusBadge}</td>
    </tr>
  `;
}

function renderPaginationControls(currentPage, listingsPerPage) {
  const totalPages = Math.ceil(allData.length / listingsPerPage);
  let paginationControls = "";

  // Disable previous button on first page
  const prevOnClick = currentPage > 1 ? `renderPage(${currentPage - 1}, ${listingsPerPage})` : "";
  const prevDisabled = currentPage === 1 ? "disabled" : "";
  paginationControls += `<li class="page-item"><button class="page-link" onclick="${prevOnClick}" ${prevDisabled}><i class="bi bi-arrow-left"></i></button></li>`;

  for (let i = 1; i <= totalPages; i++) {
    const activeClass = i === currentPage ? "active" : "";
    paginationControls += `<li class="page-item ${activeClass}"><button class="page-link" onclick="renderPage(${i}, ${listingsPerPage})">${i}</button></li>`;
  }

  // Disable next button on last page
  const nextOnClick =
    currentPage < totalPages ? `renderPage(${currentPage + 1}, ${listingsPerPage})` : "";
  const nextDisabled = currentPage === totalPages ? "disabled" : "";
  paginationControls += `<li class="page-item"><button class="page-link" onclick="${nextOnClick}" ${nextDisabled}><i class="bi bi-arrow-right"></i></button></li>`;

  $(".pagination").html(paginationControls);
}

function renderPage(pageNumber, listingsPerPage) {
  const startIndex = (pageNumber - 1) * listingsPerPage;
  const endIndex = startIndex + listingsPerPage;
  const pageData = allData.slice(startIndex, endIndex);

  let rows = "";
  const totalRowCount = allData.length;

  pageData.forEach((row, index) => {
    rows += renderTableRow(row, totalRowCount, startIndex, index);
  });

  $("#mailTableBody").html(rows);
  hideLoading();

  $("button.view-btn").on("click", function (e) {
    const bodyContent = $(this).data("body-content");
    showBodyContent(bodyContent);
  });

  renderPaginationControls(pageNumber, listingsPerPage);
}

$(".pagination").on("click", "button", function () {
  const pageNumber = parseInt($(this).text());
  const currentPage = parseInt($(".pagination .active .page-link").text());

  if ($(this).hasClass("previous-page-btn")) {
    renderPage(currentPage - 1, listingsPerPage);
  } else if ($(this).hasClass("next-page-btn")) {
    renderPage(currentPage + 1, listingsPerPage);
  } else {
    renderPage(pageNumber, listingsPerPage);
  }
});

function changeListingsPerPage(newListingsPerPage) {
  renderPage(1, newListingsPerPage);
}

function showBodyContent(bodyContent) {
  // $("#modalContent").html(`<img src="${bodyContent}" alt="Body Content" class="img-fluid">`);
  $("#modalContent").html(bodyContent);
  $("#detailsModalLabel").text("메일 본문 상세");
  $("#detailsModal").modal("show");
}

function showCollectionIdList(collectionIdList) {
  const ids = collectionIdList.split(",");
  let content = "<ol>";
  ids.forEach((id) => {
    content += `<li>${id}</li>`;
  });
  content += "</ol>";
  $("#modalContent").html(content);
  $("#detailsModalLabel").text("Collection ID List");
  $("#detailsModal").modal("show");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const ampm = hours >= 12 ? "오후" : "오전";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  hours = String(hours).padStart(2, "0");

  return `${year}-${month}-${day} ${ampm} ${hours}:${minutes}:${seconds} `;
}

function editSendStartTime(no, sendStartTime) {
  timeZ = getAllowedTimeZone();
  const isAm = sendStartTime.includes("오전");
  const ampmIndex = isAm ? sendStartTime.indexOf("오전") : sendStartTime.indexOf("오후");
  const formattedSendStartTime =
    sendStartTime.slice(0, ampmIndex) + sendStartTime.slice(ampmIndex + 3);
  const dateAndTime = formattedSendStartTime.split(" ");
  const time = dateAndTime[1].split(":");
  let hours = parseInt(time[0]);

  if (!isAm && hours !== 12) {
    hours += 12;
  } else if (isAm && hours === 12) {
    hours = 0;
  }

  dateTimeValue = `${dateAndTime[0]}T${String(hours).padStart(2, "0")}:${time[1]}`;

  const content = `
  <label for="sendStartTimeInput">Send Start Time:</label>
  <p class="text-red">발송 가능한 시간: ${timeZ.startTime} ~ ${timeZ.endTime}</p>
  <input type="datetime-local" id="sendStartTimeInput" value="${dateTimeValue}" class="form-control" min="${getCurrentDateTimeForInput()}" onchange="setMinValue()">
  <button class="btn btn-warning mt-3" onclick="updateSendStartTime(${no})">발송시간변경</button>
`;

  $("#modalContent").html(content);
  $("#detailsModalLabel").text("Edit Send Start Time");
  $("#detailsModal").modal("show");
}

function updateSendStartTime(no) {
  const message = "발송 시각을 변경하시겠습니까?";
  if (confirm(message)) {
    const newSendStartTime = $("#sendStartTimeInput").val();
    // console.log("timeZ: ", timeZ);
    // console.log("newSendStartTime: ", newSendStartTime);
    if (!isTimeWithinAllowedRange(newSendStartTime, timeZ)) {
      alert("발송 가능한 시간 범위 내에서 선택해야 합니다.");
      return false;
    }
    $.ajax({
      url: "/db/updateMailDeliverySchedule",
      type: "post",
      data: { no, newSendStartTime },
      success: function () {
        $("#detailsModal").modal("hide");
        fetchMailDeliverySchedule();
      },
      error: function () {
        alert("Failed to update send start time.");
      },
    });
  }
}

function getCurrentDateTimeForInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// function setMinValue() {
//   let dateElement = $("#sendStartTimeInput");
//   let date = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
//     .toISOString()
//     .slice(0, -5);
//   dateElement.attr("min", date);
//   if (dateElement.val() < date) {
//     alert("현재 시간보다 이전의 날짜는 설정할 수 없습니다.");
//     dateElement.val(date);
//   }
// }

function setMinValue() {
  let dateElement = $("#sendStartTimeInput");
  let date = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, -5);
  dateElement.attr("min", date);

  const allowedTimeRange = getAllowedTimeZone();
  const selectedTime = new Date(dateElement.val());

  if (dateElement.val() < date || !isTimeWithinAllowedRange(selectedTime, allowedTimeRange)) {
    alert(
      `1. 현재 시간보다 이전의 날짜는 설정할 수 없으며\n2. 발송 가능한 시간 범위 내에서 선택해야 합니다.`
    );
    dateElement.val(dateTimeValue);
  }
}

function showLoading() {
  $("body").append("<div class='overlay'></div>");
  $("body").css("pointer-events", "none");
  $("body").append(
    `<div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>`
  );
}

function hideLoading() {
  $(".overlay").remove();
  $(".spinner-border").remove();
  $("body").css("pointer-events", "auto");
}

function getAllowedTimeZone() {
  let timeZone;
  $.ajax({
    type: "post",
    url: "/db/getAllowedTimeZone",
    // data: "data",
    async: false,
    dataType: "json",
    success: function (response) {
      // console.log("response: ", response);
      timeZone = response;
    },
    error: (xhr, status, error) => {
      console.log("ajax error: ", error);
    },
  });
  return timeZone;
}

function isTimeWithinAllowedRange(time, allowedTimeRange) {
  // console.log("time: ", time);
  // console.log("allowedTimeRange: ", allowedTimeRange);

  const timeObj = new Date(time);
  const timeHours = timeObj.getHours();
  const timeMinutes = timeObj.getMinutes();
  const timeSeconds = timeObj.getSeconds();

  const allowedStart = allowedTimeRange.startTime.split(":");
  const allowedEnd = allowedTimeRange.endTime.split(":");

  const allowedStartHours = parseInt(allowedStart[0]);
  const allowedStartMinutes = parseInt(allowedStart[1]);
  const allowedStartSeconds = parseInt(allowedStart[2]);

  const allowedEndHours = parseInt(allowedEnd[0]);
  const allowedEndMinutes = parseInt(allowedEnd[1]);
  const allowedEndSeconds = parseInt(allowedEnd[2]);

  const isAfterAllowedStart =
    timeHours > allowedStartHours ||
    (timeHours === allowedStartHours && timeMinutes > allowedStartMinutes) ||
    (timeHours === allowedStartHours &&
      timeMinutes === allowedStartMinutes &&
      timeSeconds >= allowedStartSeconds);

  const isBeforeAllowedEnd =
    timeHours < allowedEndHours ||
    (timeHours === allowedEndHours && timeMinutes < allowedEndMinutes) ||
    (timeHours === allowedEndHours &&
      timeMinutes === allowedEndMinutes &&
      timeSeconds <= allowedEndSeconds);

  return isAfterAllowedStart && isBeforeAllowedEnd;
}
 */
