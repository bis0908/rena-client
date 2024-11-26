$("#delivery-table tfoot th").each(function () {
  let title = $(this).text();
  $(this).html(
    '<input type="text" placeholder="Search ' +
      title +
      '" style="width:100%; box-sizing: border-box;" />'
  );
});

$("#getServerStatus").on("click", async function () {
  try {
    const result = await $.ajax({
      type: "post",
      url: "/api/mail_server_status",
      dataType: "json",
    });
    // console.log(result);
    const listItems = generateServerStatusList(result);
    $("#serverStatus .modal-body").html(listItems);
  } catch (error) {
    console.error(error);
  }
});

// Function to load data from server
/* function getMailGroupState() {
  showLoading();
  $.ajax({
    type: "post",
    url: "/db/getMailGroupState",
    dataType: "json",
    success: function (response) {
      // console.log("response: ", response);
      if (response && response.length > 0) {
        // Update the DataTable with the new data
        $("#delivery-table").DataTable().clear();
        $("#delivery-table").DataTable().rows.add(response);
        $("#delivery-table").DataTable().draw();
        hideLoading();
      } else if (response) {
        hideLoading();
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      throw errorThrown;
    },
  });
} */

function getTodaySentGroup() {
  showLoading();
  $.ajax({
    type: "post",
    url: "/db/getTodaySendedGroup",
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        if ($.fn.DataTable.isDataTable("#delivery-table")) {
          $("#delivery-table").DataTable().clear();
          $("#delivery-table").DataTable().destroy();
        }
        initDataTables();
        if (response.data.length > 0) {
          $("#delivery-table").DataTable().rows.add(response.data);
          $("#delivery-table").DataTable().draw();
        }
        hideLoading();
      } else {
        hideLoading();
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      throw errorThrown;
    },
  });
}

function getWeekSentGroup() {
  showLoading();
  $.ajax({
    type: "post",
    url: "/db/getWeekSendedGroup",
    dataType: "json",
    success: function (response) {
      console.log("draw week");
      if (response.isSuccess) {
        if ($.fn.DataTable.isDataTable("#delivery-table")) {
          $("#delivery-table").DataTable().clear();
          $("#delivery-table").DataTable().destroy();
        }
        initDataTables();
        if (response.data.length > 0) {
          $("#delivery-table").DataTable().rows.add(response.data);
          $("#delivery-table").DataTable().draw();
        }
        hideLoading();
      } else {
        hideLoading();
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      throw errorThrown;
    },
  });
}

function getAllSentGroup() {
  showLoading();
  $.ajax({
    type: "post",
    url: "/db/getMailGroupState",
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        if ($.fn.DataTable.isDataTable("#delivery-table")) {
          $("#delivery-table").DataTable().clear().destroy();
        }
        initDataTables();
        var table = $("#delivery-table").DataTable();
        console.log("draw");
        table.clear(); // 기존 데이터를 지웁니다.
        table.rows.add(response.data); // 새로운 데이터를 추가합니다.
        table.draw(); // 데이터를 그립니다.
        hideLoading();
      } else {
        hideLoading();
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
      throw errorThrown;
    },
  });
}

// ajax call getMailGroupStateDetail(no).
function getMailGroupStateDetail(rowNo) {
  showLoading();
  $.ajax({
    type: "post",
    url: "/db/getMailGroupStateDetail",
    data: { rowNo },
    dataType: "json",
    success: function (response) {
      if (response && response.length > 0) {
        $("#detailsModalLabel").text(response[0].title);
        $("#modalContent").html(response[0].contents);
        $("#detailsModal").modal("show");
        hideLoading();
      } else {
        hideLoading();
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      hideLoading();
      throw errorThrown;
    },
  });
}

function getMailStateDetail(groupName) {
  showLoading();
  $.ajax({
    type: "post",
    url: "/db/getDeliveryScheduleV2",
    data: { groupName },
    dataType: "json",
    success: function (response) {
      if (response && response.length > 0) {
        // console.log(response);
        $("#delivery-table").DataTable().clear();
        $("#delivery-table").DataTable().rows.add(response);
        $("#delivery-table").DataTable().draw();
        hideLoading();
      }
    },
    error: (jqXHR, textStatus, errorThrown) => {
      console.error(textStatus, errorThrown);
    },
  });
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

function imageHandler() {
  let fileInput = this.container.querySelector("input.ql-image[type=file]");
  if (fileInput == null) {
    fileInput = document.createElement("input");
    fileInput.setAttribute("type", "file");
    fileInput.setAttribute(
      "accept",
      "image/png, image/gif, image/jpeg, image/bmp, image/x-icon"
    );
    fileInput.classList.add("ql-image");
    fileInput.addEventListener("change", () => {
      if (fileInput.files != null && fileInput.files[0] != null) {
        let file = fileInput.files[0];
        // check file size
        // if (file.size > 4194304) { // 4MB
        // if (file.size > 102400) { // 100kb
        if (file.size > 307200) {
          // 300kb
          /* showToast("이미지 용량은 300kb 미만이어야 합니다.", "warning");
          return; */
          resizeImage(file, 300, (resizedImageData) => {
            insertToEditor(resizedImageData);
          });
        } else {
          readFile(file, (readImageData) => {
            insertToEditor(readImageData);
          });
        }
      }
    });
    this.container.appendChild(fileInput);
  }
  fileInput.click();
}

function resizeImage(file, maxKB, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let quality = maxKB / (file.size / 1024);
      quality = quality < 0.1 ? 0.1 : quality;

      let dataUrl;
      do {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
        quality -= 0.1;
      } while (dataUrl.length > maxKB * 1024 && quality > 0.1);

      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function readFile(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    callback(e.target.result);
  };
  reader.readAsDataURL(file);
}

function insertToEditor(imageData) {
  const range = quill3.getSelection(true);
  const Delta = Quill3.import("delta");
  quill3.updateContents(
    new Delta()
      .retain(range.index)
      .delete(range.length)
      .insert({ image: imageData }),
    "user"
  );
}
