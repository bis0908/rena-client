/* $(document).ready(function () {
  showLoading();
  setTimeout(() => {
    fetchMailDeliverySchedule();
  }, 500);

  // function resizeFonts() {
  //   if ($(window).width() < 800) {
  //     $("table").addClass("table-sm");
  //   } else {
  //     $("table").removeClass("table-sm");
  //   }
  // }

  // // Call the function on initial load
  // resizeFonts();

  // // Call the function when the window is resized
  // $(window).resize(resizeFonts);
});

let allData = [];

function fetchMailDeliverySchedule() {
  $.post("/db/mailDeliverySchedule", (data) => {
    allData = data;
    // console.log("data: ", data);

    $("#data-table").DataTable({
      data: allData,
      columns: [
        {
          data: null,
          render: function (data, type, row, meta) {
            return row.no;
          },
        },
        { data: "mail_agent" },
        {
          data: "collection_id_list",
          render: function (data, type, row) {
            // Remove parentheses and quotation marks
            const arrayData = JSON.parse(data);
            return arrayData.join(", ");
          },
        },
        { data: "sender_name" },
        {
          data: "mail_title",
          render: (data) => {
            const title = JSON.parse(data);
            return title;
          },
        },
        // { data: "body_content" },
        {
          data: "dispatch_registration_time",
          render: (data) => {
            const regDate = formatDate(data);
            return regDate;
          },
        },
        {
          data: "send_start_time",
          render: (data) => {
            const regDate = formatDate(data);
            return regDate;
          },
        },
        {
          data: "dispatch_finish_time",
          render: (data) => {
            const regDate = formatDate(data);
            return regDate;
          },
        },
        { data: "reservation_sent" },
        {
          data: "send_status",
          render: (data) => {
            return statusBadge(data);
          },
        },
      ],
    });
    hideLoading();
  }).fail(() => {
    alert("Failed to fetch mail delivery schedule data.");
  });
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

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const amPm = hours >= 12 ? "오후" : "오전";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  hours = String(hours).padStart(2, "0");

  return `${year}-${month}-${day} ${amPm} ${hours}:${minutes}:${seconds} `;
}

function setMinValue() {
  let dateElement = $("#sendStartTimeInput");
  let date = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, -5);
  dateElement.attr("min", date);
  if (dateElement.val() < date) {
    alert("현재 시간보다 이전의 날짜는 설정할 수 없습니다.");
    dateElement.val(date);
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

function statusBadge(data) {
  let statusBadge = "";

  switch (data) {
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
  return statusBadge;
}

 */
