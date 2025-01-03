$("#delivery-table tfoot th").each(function () {
  let title = $(this).text();
  $(this).html(
    '<input type="text" placeholder="Search ' +
      title +
      '" style="width:100%; box-sizing: border-box;" />'
  );
});

async function fetchServerStatus() {
  try {
    const result = await $.ajax({
      type: "post",
      url: "/api/mail_server_status",
      dataType: "json",
    });
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function fetchGroupData(url) {
  try {
    showLoading();
    const response = await $.ajax({
      type: "post",
      url: url,
      dataType: "json",
    });
    
    if (response.isSuccess) {
      if ($.fn.DataTable.isDataTable("#delivery-table")) {
        $("#delivery-table").DataTable().clear().destroy();
      }
      initDataTables();
      if (response.data.length > 0) {
        $("#delivery-table").DataTable().rows.add(response.data);
        $("#delivery-table").DataTable().draw();
      }
    }
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    hideLoading();
  }
}

$("#getServerStatus").on("click", async function () {
  try {
    const result = await fetchServerStatus();
    const listItems = generateServerStatusList(result);
    $("#serverStatus .modal-body").html(listItems);
  } catch (error) {
    console.error(error);
  }
});

function getTodaySentGroup() {
  return fetchGroupData("/db/getTodaySendedGroup");
}

function getWeekSentGroup() {
  return fetchGroupData("/db/getWeekSendedGroup");
}

function getAllSentGroup() {
  return fetchGroupData("/db/getMailGroupState");
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
  hours = hours ? hours : 12;
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

async function imageHandler() {
  let fileInput = this.container.querySelector("input.ql-image[type=file]");
  if (!fileInput) {
    fileInput = createImageFileInput(this.container);
  }
  fileInput.click();
}

function createImageFileInput(container) {
  const fileInput = document.createElement("input");
  fileInput.setAttribute("type", "file");
  fileInput.setAttribute(
    "accept",
    "image/png, image/gif, image/jpeg, image/bmp, image/x-icon"
  );
  fileInput.classList.add("ql-image");
  
  fileInput.addEventListener("change", () => {
    if (fileInput.files?.[0]) {
      const file = fileInput.files[0];
      if (file.size > 307200) { // 300kb
        resizeImage(file, 300, insertToEditor);
      } else {
        readFile(file, insertToEditor);
      }
    }
  });
  
  container.appendChild(fileInput);
  return fileInput;
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
