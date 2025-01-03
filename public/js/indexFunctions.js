let transInfoBackup = {};

const loadManager = {
  /**
   * @param {string} key
   * @param {*} value
   */
  setItem: (key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * @param {string} key
   * @returns {Array<object>} - Array of Object
   */
  getItem: (key) => {
    return JSON.parse(sessionStorage.getItem(key)) || [];
  },

  /**
   *
   * @param {string} key
   * @param {string} id
   * @returns {Object | null}
   */
  getItemById: (key, id) => {
    const items = JSON.parse(sessionStorage.getItem(key)) || [];
    return items.find((item) => item.id === id);
  },

  /**
   * @param {string} key
   */
  removeItem: (key) => {
    sessionStorage.removeItem(key);
  },

  // getAllKeys: () => {
  //   const keys = [];
  //   for (let i = 0; i < sessionStorage.length; i++) {
  //     keys.push(sessionStorage.key(i));
  //   }
  //   return keys;
  // },

  clear: () => {
    sessionStorage.clear();
  },
};

const createMessage = (senderEmail, senderName, action) =>
  `${senderEmail} 계정이 발송기 [${senderName}] 에서 ${action} 되었습니다.`;

// 중복 코드 제거 및 함수화
function handleSocketEvents() {
  socket.on("getEmailStateChanged", (data) => {
    const { state, senderEmail, agent_no, mail_no, senderName } = data;
    const senderList = loadManager.getItem(strSenderEmail);
    const isSenderInList = senderList.includes(senderEmail);
    const isCurrentAgent = senderId === agent_no;

    if (state) {
      if (isCurrentAgent) {
        switchOn(senderEmail);
        if (!isSenderInList) {
          loadManager.setItem(strSenderEmail, [
            ...new Set([...senderList, senderEmail]),
          ]);
          $("#mailId .badge").text(senderList.length + 1);
          updateSearchResult(strSenderEmail, 2, senderIdList);
        }
      }
      findEmailAddBadge(mail_no, senderName, agent_no);
      showToast(createMessage(senderEmail, senderName, "활성화"), "success");
    } else {
      if (isCurrentAgent) {
        switchOff(senderEmail);
        if (isSenderInList) {
          loadManager.setItem(
            strSenderEmail,
            senderList.filter((sender) => sender !== senderEmail)
          );
          updateSearchResult(strSenderEmail, 2, senderIdList);
          $("#mailId .badge").text(senderList.length - 1);
        }
      }
      findEmailRemoveBadge(mail_no, agent_no);
      showToast(createMessage(senderEmail, senderName, "비활성화"), "warning");
    }
  });

  socket.on("newSenderEmail", (data) => {
    const { newId, insertId } = data;
    const newEmailDom = createSenderEmailList(newId);
    const newIdObj = [{ id: newId, no: insertId }];
    senderEmailTotal = Array.from(
      new Set([...senderEmailTotal, ...newIdObj].map(JSON.stringify))
    ).map(JSON.parse);
    $("#sender-list .badge").text(senderEmailTotal.length);
    $("#senderTotalList").prepend(newEmailDom);
    showToast(
      `${newId} 계정이 전체 발송 계정 목록에 추가되었습니다.`,
      "success"
    );
  });

  socket.on("unassignAll", () => {
    showToast("모든 발송 계정이 비활성화 되었습니다.", "danger");
    loadManager.removeItem(strSenderEmail);
    updateSearchResult(strSenderEmail, 2, senderIdList);
    $(".form-switch .sender-switch").each(function () {
      $(this).prop("checked", false);
      $(this).siblings(".agent-badge").remove();
    });
    $("#mailId .badge").text("0");
  });

  socket.on("deleteSender", (email) => {
    removeSenderEmail(email);
    showToast(`${email} 계정이 삭제되었습니다.`, "danger");
  });

  socket.on("renameAgent", (data) => {
    const { oldAgentName, agentName, agent_no } = data;
    findEmailEditBadge(agentName, agent_no);
    showToast(
      `[${oldAgentName}] 발송기 이름이 [${agentName}]으로 변경되었습니다.`,
      "info"
    );
  });

  socket.on("progress", (percentage) => {
    updateProgressBar(percentage);
  });
}

$(function () {
  setTimeout(() => {
    mySocketId = socket.id;
  }, 500);
  handleSocketEvents();
});

const changeSpinnerState = (index, successFailure) => {
  const spinStatus = $(`div[data-spinIdx=${index}]`);
  spinStatus.removeClass("spinner-grow").removeClass("spinner-grow-sm");
  if (successFailure) {
    spinStatus.addClass("bi bi-circle-fill text-success");
  } else {
    spinStatus.addClass("bi bi-circle-fill text-danger");
  }
};

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

  return `${year}-${month}-${day} ${amPm} ${hours}:${minutes}:${seconds}`;
}

const sendTestAll = () => {
  if (senderId === undefined) {
    showToast("발송기를 선택해주세요", "warning");
    return;
  }

  const senderName = $("#senderName").val();
  const testId = $("#testAllInput").val();
  if (!senderName) {
    showToast("발송명을 입력해주세요", "warning");
    return;
  }
  if (!testId) {
    showToast("Test ID를 입력해주세요", "warning");
    return;
  }

  const senderEmails = loadManager.getItem(strSenderEmail);

  if (senderEmails && senderEmails.length > 0) {
    $("#senderEmailModalBody").html("");

    senderEmails.forEach(async function (email, index) {
      await sendTestMail(email, testId, senderName, index);
    });
  } else {
    showToast("발신자 이메일이 없습니다.", "warning");
  }

  let myModal = new bootstrap.Modal(
    document.getElementById("senderEmailModal"),
    {
      backdrop: "static",
      keyboard: false,
    }
  );

  myModal.show();
  $("#senderEmailModal .btn-close").prop("disabled", true);
};

const updateKeywordList = (senderId) => {
  $(".sender-search-area").html("");
  const keywordList = getKeyWordList(senderId);

  if (keywordList === false) {
    $("#senderModal .modal-body ul").html("");
    $("#senderModalLabel").text("키워드 프리셋");

    const addon = `<div class="input-group mb-3 mt-3">
        <input type="text" class="form-control" placeholder="키워드 추가하기" aria-label="키워드 추가하기" aria-describedby="button-addon2" id="addKeywordInput">
        <button class="btn btn-outline-success" type="button" id="addKeyword">추가</button>
        </div>
        <div class="btn-group" role="group">
          <button type="button" class="btn btn-success" id="insertKeyword">키워드 선택</button>
          <button type="button" class="btn btn-warning" id="selectAndSearch">키워드 선택 + 검색</button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-secondary"
            id="checkAll">모두 선택/해제</button>
            <button type="button" class="btn btn-danger"
            id="resetAll">전체 삭제</button>
          </div>`;
    $("#senderModal .modal-body ul").append(addon);
    chooseKeyWord();
    $("#senderModal").modal("show");
  } else {
    const listItems = generateKeyWordListItems(keywordList);
    $("#senderModal .modal-body ul").html(listItems);
    $("#senderModalLabel").text("키워드 프리셋");
    const addon = `<div class="input-group mb-3 mt-3">
          <input type="text" class="form-control" placeholder="키워드 추가하기" aria-label="키워드 추가하기" aria-describedby="button-addon2" id="addKeywordInput">
          <button class="btn btn-outline-success" type="button" id="addKeyword">추가</button>
          </div>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-success" id="insertKeyword">키워드 선택</button>
            <button type="button" class="btn btn-warning" id="selectAndSearch">키워드 선택 + 검색</button>
          </div>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-secondary checkall"
            id="checkAll">모두 선택/해제</button>
            <button type="button" class="btn btn-danger"
            id="resetAll">전체 삭제</button>
          </div>`;
    $("#senderModal .modal-body ul").append(addon);
    chooseKeyWord();
    keepCheckBox();
    $("#senderModal").modal("show");
  }
};

function keepCheckBox() {
  selectedKeywords.forEach((keyword) => {
    const addedKeyword = $(`.modal-body ul li:contains(${keyword})`);
    if (addedKeyword.length > 0) {
      addedKeyword.find("input[type='checkbox']").prop("checked", true);
    }
  });
}

/* function mailListKeyDown(index) {
  if ($("#nav-0").index() == index) {
    $(idSearchResult)
      .off("keydown")
      .on("keydown", function (e) {
        let option = $(this).children("option:selected").val();
        if (e.key == "Delete") {
          const collectedId = loadManager.getItem(strSearchResults);
          const updatedCollectedId = collectedId.filter((id) => {
            return id !== option ? true : false;
          });
          loadManager.setItem(strSearchResults, updatedCollectedId);
          $(this).children("option:selected").remove();
          $("#collectedId .badge").text(updatedCollectedId.length);
          // updateSearchResult(strSearchResults, 0, idSearchResult);
        } else if (e.key == "Tab") {
          e.preventDefault();
          option = option.replace(" ", "").split("/")[0];
          const message = `수집ID '${option}' 를 블랙리스트에 추가하시겠습니까?`;
          if (confirm(message)) {
            const time = getDate();
            addBlackListFromDB(option, time);
            $(this).children("option:selected").remove();
          }
        }
      });
  }
} */

function changeSenderEmail(oldId, newId, domain) {
  $("#new-sender-id").css("pointer-events", "none").css("opacity", "0.5");

  $.post(
    "/db/changeSender",
    { oldId, newId, domain },
    function (data, textStatus, jqXHR) {
      $("#new-sender-id").css("pointer-events", "").css("opacity", "");

      const messageFromServer = JSON.stringify(
        data.message.name ?? data.message
      ).replace(/"/g, "");

      alert(messageFromServer);

      if (data.success) {
        let senderEmails = loadManager.getItem(strSenderEmail);
        senderEmails = senderEmails.map((email) =>
          email === oldId ? newId + "@" + oldId.split("@")[1] : email
        );
        loadManager.setItem(strSenderEmail, senderEmails);
        updateSearchResult(strSenderEmail, 2, senderIdList);

        $(".form-switch .sender-switch").each(function () {
          const $this = $(this);
          const $parentLi = $this.closest("li");
          const id = $this.data("email");
          if (id === oldId + "@" + domain) {
            const newDomain = newId + "@" + domain;
            // reference -> https://api.jquery.com/data/#data-key-value
            $this.attr("data-email", newDomain);
            $this.data("email", newDomain);
            const $label = $parentLi.find(".form-check-label");
            $label.text(newDomain);
            $label.attr("for", newDomain);
          }
        });
        $("#senderModal").modal("hide");
      }
    },
    "json"
  );
}

function getDate() {
  let today = new Date();
  let year = today.getFullYear();
  let month = ("0" + (today.getMonth() + 1)).slice(-2);
  let day = ("0" + today.getDate()).slice(-2);
  let hours = ("0" + today.getHours()).slice(-2);
  let minutes = ("0" + today.getMinutes()).slice(-2);
  let seconds = ("0" + today.getSeconds()).slice(-2);

  let dateString = year + "-" + month + "-" + day;
  let timeString = hours + ":" + minutes + ":" + seconds;
  return dateString + " " + timeString;
}

/**
 * @description Set each tabs session storage and fill the DOM
 * @param {string} sessionRepo
 * @param {number} index
 * @param {jQuery|HTMLElement} selectTagId
 */
function updateSearchResult(sessionRepo, index, selectTagId) {
  selectTagId.html("");

  const session =
    loadManager.getItem(sessionRepo).length > 0
      ? loadManager.getItem(sessionRepo)
      : undefined;

  if (index >= 0 && index <= 2) {
    fillDOM(session, index, selectTagId);
  }
}

/**
 *
 * @param list
 * @param index
 * @param selectTagId
 */
function fillDOM(list, index, selectTagId) {
  if (list == undefined || null) {
    if (index == 0) {
      $("#collectedId .badge").text(0);
    }

    if (index == 1) {
      $("#sentId .badge").text(0);
    }

    if (index == 2) {
      $("#mailId .badge").text(0);
    }
  } else if (list != undefined || null) {
    list.forEach((element, index) => {
      let classStyle = "";
      if (element.status) {
        switch (element.status) {
          case 4:
            classStyle += "class=status-4 title='선정'";
            break;
          case 5:
            classStyle += "class=status-5 title='예약'";
            break;
          case 7:
            classStyle += "class=status-7 title='리뷰대기'";
            break;
          case 8:
            classStyle += "class=status-8 title='등록완료'";
            break;

          default:
            break;
        }
      }

      if (element.isUnsubscribe) {
        classStyle += "class='text-light bg-dark'";
      }

      if (element.member) {
        let option = `<option data-index="${index}" style="color: blue;" ${classStyle}>${element.id} / ${element.score} / ${element.member}</option>`;
        selectTagId.append(option);
      } else if (element.id) {
        let option = `<option data-index="${index}" ${classStyle}>${element.id
          } / ${element.score ? element.score : "지수 없음"}</option>`;
        selectTagId.append(option);
      } else {
        let option = `<option data-index="${index}" ${classStyle}>${element}</option>`;
        selectTagId.append(option);
      }
    });

    const blogIdTotal = list.length > 0 ? list.length : 0;

    if (index == 0) {
      $("#collectedId .badge").text(blogIdTotal);
    }

    if (index == 1) {
      $("#sentId .badge").text(blogIdTotal);
    }

    if (index == 2) {
      $("#mailId .badge").text(blogIdTotal);
    }
  }
}

function baseLiTag(senderName, no) {
  const baseLiTag = `<div class="d-flex justify-content-center sender-row">
  <li class="list-group-item">
  <input class="form-check-input me-1" type="radio" name="listGroupRadio" data-senderId="${no}" id="${senderName + no
    }">
  <label class="form-check-label" for="${senderName + no
    }">${no}. ${senderName}</label>
  </li>
  <button type="button" class="btn btn-primary" id="changeSenderName">이름변경</button>
  </div>`;

  return baseLiTag;
}

function keywordLiTag(keyword, no) {
  let keywordLabel = keyword;
  if (keyword[0].length > 35) {
    const chunks = keyword[0].match(/.{1,35}/g);
    keywordLabel = chunks.join("<br>");
  }
  return `
    <div class="d-flex justify-content-center">
      <li class="list-group-item">
        <input class="form-check-input me-1" type="checkbox" data-no="${no}" id="${keyword}">
        <label class="form-check-label" for="${keyword}">${keywordLabel}</label>
      </li>
      <button type="button" class="btn btn-danger" data-no="${no}" data-keyword="${keyword}" id="deleteKeyWord">삭제</button>
    </div>
  `;
}

function changedLiTag(senderName, agent_no) {
  const baseLiTag = `
  <li class="list-group-item">
  <input class="form-check-input me-1" type="radio" name="listGroupRadio" data-senderId="${agent_no}" id="${senderName}">
  <label class="form-check-label" for="${senderName}">
  ${agent_no}. ${senderName}</label>
  </li>
  <button type="button" class="btn btn-primary" id="changeSenderName">이름변경</button>
  `;
  return baseLiTag;
}

// Create a function to generate list items for each sender
function generateSenderListItems(senderNameNums) {
  let listItems = "";
  senderNameNums.forEach((senderNameNum) => {
    listItems += baseLiTag(senderNameNum.name, senderNameNum.no);
  });
  return listItems;
}

function generateKeyWordListItems(keywords) {
  // console.log("keywords: ", keywords);
  let listItems = "";
  keywords.forEach((keyword) => {
    listItems += keywordLiTag(JSON.parse(keyword.keyword), keyword.no);
  });
  return listItems;
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
  const range = quill.getSelection(true);
  const Delta = Quill.import("delta");
  quill.updateContents(
    new Delta()
      .retain(range.index)
      .delete(range.length)
      .insert({ image: imageData }),
    "user"
  );
}

/**
 *
 * @returns Insert sender name and number into the input tag.
 */
function chooseSender() {
  $("#senderModal .modal-body ul")
    .off("click", "li")
    .on("click", "li", function (e) {
      e.preventDefault();
      $("#senderModal .modal-body li").removeClass("active");
      $(this).addClass("active");
      selectedSenderName = $(this).text().trim();
      senderId = $(this).children().data("senderid");
      $("#selectedSender").val(selectedSenderName);
      toggleSenderSwitch();
      console.log("발송기: ", selectedSenderName);

      $("#selectedSender").attr("data-senderid", senderId);
      let currentDate = new Date();
      let formattedDate =
        currentDate.getFullYear() +
        "-" +
        ("0" + (currentDate.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + currentDate.getDate()).slice(-2);
      $("#senderGroup").val(
        selectedSenderName.split(".")[1].trim() + "_" + formattedDate
      );

      $("#senderModal").modal("hide");
      senderEmailInfo = getSenderEmail(senderId);

      let id = [];
      for (const key in senderEmailInfo) {
        id.push(senderEmailInfo[key].id);
      }
      loadManager.setItem(strSenderEmail, [...new Set(id)]);
      markCheckedSenderEmails(id);
      updateSearchResult(strSenderEmail, 2, senderIdList);
    });
}

function chooseKeyWord() {
  $("#senderModal .modal-body ul")
    .off("click", "li")
    .on("click", "li", function (event) {
      event.stopPropagation();
      const keyword = $(this).text().trim();
      const no = $(this).children().data("no");
      if ($(this).find(":checkbox").is(":checked")) {
        event.stopPropagation();
        selectedKeywords.push(keyword);
      } else {
        event.stopPropagation();
        selectedKeywords = selectedKeywords.filter((item) => item !== keyword);
      }
    });
}

function getSenderList() {
  let senderList;
  $.ajax({
    type: "post",
    url: "/db/getSender",
    dataType: "json",
    async: false,
    success: (response) => {
      senderList = response;
    },
    error: (xhr, status, error) => {
      console.log("ajax error: ", error);
    },
  });
  return senderList;
}

/**
 * @description check already sent or unsubscribe
 * @param {array} arrOfId
 * @param {number} senderId
 * @returns
 */
async function getIdFromDB(arrOfId, senderId) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "post",
      url: "/db/addManual",
      data: { idList: arrOfId, no: senderId, mySocketId },
      dataType: "json",
      async: false,
      success: (response) => {
        resolve(response);
      },
      error: (xhr, status, error) => {
        console.error(error.message);
        showToast("ID 추가 실패. 관리자에게 문의 해주세요", "danger");
        reject(error);
      },
    });
  });
}

function getSenderEmail(senderNo) {
  let sensitiveInfo;
  $.ajax({
    type: "post",
    url: "/db/getSenderEmail",
    dataType: "json",
    async: false,
    data: { no: senderNo },
    success: (response) => {
      sensitiveInfo = response;
    },
    error: (xhr, status, error) => {
      console.error("ajax error: ", error);
    },
  });
  return sensitiveInfo;
}

function updateSenderName(senderName, newSenderName, senderNo) {
  $.ajax({
    type: "post",
    url: "/db/changeSenderName",
    data: { name: newSenderName, no: senderNo },
    dataType: "json",
    async: false,
    success: (response) => {
      if (response.isSuccess) {
        showToast("발송기 이름 변경 성공", "success");
        findEmailEditBadge(newSenderName, senderNo);
        if (senderId == senderNo) {
          $("#selectedSender").val(senderNo + ". " + newSenderName);
        }
        socket.emit("renameAgent", {
          oldAgentName: senderName,
          agentName: newSenderName,
          agent_no: senderNo,
        });
      } else {
        showToast("발송기 이름 변경 실패. 관리자에게 문의 해주세요", "danger");
      }
    },
    error: (xhr, status, error) => {
      showToast(
        "이름 변경 실패. 자세한 내용은 에러 내용을 참조하세요",
        "danger"
      );
      console.error(error.message);
    },
  });
}

function addSenderMailAccount(newId, newPw, messageFromServer) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "post",
      url: "/db/addSenderMail",
      data: { newId, newPw },
      dataType: "json",
      success: function (response) {
        if (response.isSuccess) {
          showToast(
            `새로운 계정 정보가 등록되었습니다: ${(newId, messageFromServer ?? "")
            }`,
            "success"
          );
        }
        resolve(response);
      },
      error: (xhr, status, error) => {
        console.error(xhr);
        console.error(status);
        console.error(error.message);
        reject(error);
        showToast(
          `계정 정보 등록 실패(${newId}). 관리자에게 문의 해주세요`,
          "danger"
        );
      },
    });
  });
}

function addBlackListFromDB(id, date) {
  $.ajax({
    type: "post",
    url: "/db/addBlackList",
    data: { id, date },
    dataType: "json",
    success: function (response) {
      if (response) {
        // alert(`ID ${id}가 블랙 리스트로 추가 되었습니다.`);
        const collectedId = loadManager.getItem(strSearchResults);
        const updatedCollectedId = collectedId.filter((colId) => {
          return colId !== id ? true : false;
        });
        loadManager.setItem(strSearchResults, updatedCollectedId);
        updateSearchResult(strSearchResults, 0, idSearchResult);
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
    },
  });
}

function isExistId(targetArray, compareArray) {
  const result = targetArray.filter((obj) => {
    // let blog_id = "";
    // if (idList.includes("/")) {
    //   blog_id = idList.replace(" ", "").split("/")[0];
    // } else {
    //   blog_id = idList;
    // }
    for (const key in compareArray) {
      if (compareArray[key].id) {
        if (obj.id == compareArray[key].id) {
          return false;
        }
      } else {
        if (obj.id == compareArray[key]) {
          return false;
        }
      }
    }
    return true;
  });
  return result;
}

function mergeAndResolve(arr1, arr2) {
  const merged = [...arr1, ...arr2];

  let result = merged.reduce((acc, curr) => {
    if (acc[curr.id]) {
      acc[curr.id] = acc[curr.id].score > curr.score ? acc[curr.id] : curr;
    } else {
      acc[curr.id] = curr;
    }
    return acc;
  }, {});

  return Object.values(result);
}

function showLoading() {
  if ($(".overlay").length == 0) {
    $("body").append("<div class='overlay'></div>");
    $("body").append(
      `<div class="progress">
        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="1" aria-valuemin="0" aria-valuemax="100" style="width: 1%">
        </div>
      </div>`
    );
  }
  $("body").css("pointer-events", "none");
}

function updateProgressBar(percentage) {
  $(".progress-bar").css("width", `${percentage}%`);
}

function hideLoading() {
  $(".overlay").remove();
  $(".spinner-border").remove();
  $(".progress").remove();
  $("body").css("pointer-events", "auto");
}

/**
 * @param {string} content
 * @param {string} colorClass - "primary", "secondary", "success", "info", "warning", "danger", "light", "dark"
 */
function showToast(content, colorClass) {
  const toast = $("#toast");
  const toastPopup = new bootstrap.Toast(toast);
  toast.removeClass(function (index, className) {
    return (className.match(/(^|\s)text-bg-\S+/g) || []).join(" ");
  });

  toast.addClass("text-bg-" + colorClass);
  $(".toast-body").text(content);
  toastPopup.show();
  toast.on("hidden.bs.toast", function () {
    toast.removeClass("text-bg-" + colorClass);
  });
}

function hideAndSeek(showTag, ...hideTag) {
  showTag.show();
  hideTag.forEach((tag) => {
    tag.hide();
  });
}

async function addManually() {
  let manualId = $("#manualAdd").val().replaceAll(" ", "");
  if (manualId == "") {
    return showToast("발송 대상을 입력해주세요", "warning");
  }

  const idArrObj = manualId.split(",").map((id) => {
    return { id: id };
  });

  if (senderId === undefined) {
    return showToast("발송기를 선택해주세요", "warning");
  }

  let superIDs = await getSuperIds();
  const filteredList = superIDs.map((ids) => ids.super_id);

  for (const iao of idArrObj) {
    if (filteredList.indexOf(iao) === -1) {
      // 관리자 ID를 찾지 못한 경우(-1) 이 조건문으로 들어옴.
      const checkedIdArr = await getIdFromDB([iao], senderId);

      if (Object.keys(checkedIdArr).length === 0) {
        // 이미 보냄 X, 수신거부 X 라면
        let session = loadManager.getItem(strSearchResults);
        if (session.some((obj) => obj.id === iao.id)) {
          return showToast(
            `이미 수집ID에 추가된 ID(${iao.id})가 있습니다.`,
            "warning"
          );
        }

        checkedIdArr.forEach((manualId) => {
          session.push({ id: manualId });
        });

        loadManager.setItem(strSearchResults, session);
        InsertSearchList([iao.id], "수동추가", "", "");
        // return $("#manualAdd").val("");
      } else {
        // 이미 보냄 O, 수신거부 O 라면
        for (const key in checkedIdArr) {
          // 보낸 ID에 있는지 확인
          if (iao == checkedIdArr[key].id) {
            let session = loadManager.getItem(strExistIdLists);
            const uniqueArr = session.map((obj) => obj.id).includes(iao.id);

            if (uniqueArr) {
              return showToast(
                `이미 보낸ID에 추가된 ID(${iao.id})가 있습니다.`,
                "warning"
              );
            }
            session.push(iao.id);
            loadManager.setItem(strExistIdLists, session);
          } else {
            // newId
            let session = loadManager.getItem(strSearchResults);
            if (session.some((obj) => obj.id === iao.id)) {
              return showToast(
                `이미 수집ID에 추가된 ID(${iao.id})가 있습니다.`,
                "warning"
              );
            }
            checkedIdArr.forEach((manualId) => {
              session.push(manualId);
            });

            loadManager.setItem(strSearchResults, session);
          }
        }
      }
    } else {
      const currentResult = loadManager.getItem(strSearchResults);
      const newResult = new Set([...currentResult, iao.id]);
      loadManager.setItem(strSearchResults, [...newResult]);
    }
  }
  $("#sentIdList").html("");
  $("#manualAdd").val("");
  const exist_ids = loadManager.getItem(strExistIdLists);
  idSearchResult.html(updateSearchResult(strSearchResults, 0, idSearchResult));
  fillDOM(exist_ids, 1, sentIdList);
}

function deleteSenderFromDB(senderEmail) {
  $.ajax({
    type: "post",
    url: "/db/deleteSender",
    data: { senderEmail },
    dataType: "json",
    success: function (response) {
      if (response) {
        showToast(`DB에서 '${senderEmail}' 계정이 삭제 되었습니다.`, "danger");
        removeSenderEmail(senderEmail);

        socket.emit("deleteSender", senderEmail);
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
      showToast(`DB에서 계정 삭제 실패. 관리자에게 문의 해주세요`, "danger");
    },
  });
}

function InsertSearchList(manualId, keyword, link, title) {
  Array.isArray(manualId);
  const date = getDate();

  for (let i = 0; i < manualId.length; i++) {
    let id = manualId[i];
    $.ajax({
      type: "post",
      url: "/db/InsertSearchlist",
      data: { id, keyword, link, title, senderId, date },
      dataType: "json",
      success: function (response) { },
      error: (xhr, status, error) => {
        console.error(xhr);
        console.error(status);
        console.error(error.message);
      },
    });
  }
}

function sendListClear() {
  $.ajax({
    type: "post",
    url: "/db/sendListClear",
    data: { senderId },
    dataType: "json",
    success: function (response) {
      if (response) {
        showToast("DB에서 보낸ID가 초기화 되었습니다", "info");
        loadManager.removeItem(strExistIdLists);
        updateSearchResult(strExistIdLists, 1, sentIdList);
      }
    },
  });
}

function isValidEmail(email) {
  // const emailRegex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9._]+\.[a-zA-Z0-9._]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const idRegex = /^[a-z0-9._-]+$/;
  const [id, domain] = email.split("@");
  return emailRegex.test(email) && idRegex.test(id);
}

function senderTestMail(senderEmail) {
  const testId = $("#testAllInput").val();
  const senderName = $("#senderName").val();
  $("#senderEmailModalBody").html("");

  if (!testId) {
    showToast("Test ID를 입력해주세요", "warning");
    return;
  }
  if (!senderName) {
    showToast("발송명을 입력해주세요", "warning");
    return;
  }

  const senderEmails = loadManager.getItem(strSenderEmail);

  senderEmails.foreach((email, index) => {
    if (email == senderEmail) {
      sendTestMail(email, testId, senderName, index);
    }
  });

  // Show the modal
  // $("#senderEmailModal").modal("show");
  let myModal = new bootstrap.Modal($("#senderEmailModal"), {
    backdrop: "static",
    keyboard: false,
  });

  myModal.show();
  $("#senderEmailModal .btn-close").prop("disabled", true);
}

/**
 *
 * @param {senderEmail} id
 * @param {senderPassword} pw
 * @param {to} testId
 * @param {from} senderName
 * @param {senderIndex} index
 */
async function sendTestMail(email, testId, senderName, index) {
  const senderDiv = `<div class="d-flex justify-content-between m-1">${index + 1 + ". "
    }${email}
        <div class="spinner-grow spinner-grow-sm" role="status" data-spinIdx="${index}"></div>
        </div>`;
  $("#senderEmailModalBody").append(senderDiv);

  await $.ajax({
    type: "post",
    url: "/mail/testAll",
    data: { email, testId, senderName },
    dataType: "json",
    success: function (response) {
      changeSpinnerState(index, response);
      $("#senderEmailModal .btn-close").prop("disabled", false);
    },
    error: function (xhr, status, error) {
      console.error(xhr);
      console.error(status);
      console.error(error.message);

      changeSpinnerState(index, status);

      $("#senderEmailModal .btn-close")
        .prop("disabled", false)
        .addClass("text-danger");
    },
  });
}

function setHtmlTemplate(templateName, contents, subject) {
  $.ajax({
    type: "post",
    url: "/db/setHtmlTemplate",
    data: { templateName, contents, senderId, subject },
    dataType: "json",
    success: function (response) {
      if (response) {
        showToast("템플릿 정보가 저장되었습니다.", "info");
        hideLoading();
      }
    },
    error: function (xhr, status, error) {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
    },
  });
}

// function getHtmlTemplate() {
//   $.ajax({
//     type: "post",
//     url: "/db/getHtmlTemplate",
//     async: false,
//     data: { senderId },
//     dataType: "json",
//     success: function (response) {
//       if (response.length === 0) {
//         showToast("저장된 템플릿이 없습니다.", "warning");
//         return;
//       } else {
//         templateList = response;
//         // Clear the modal body before appending new content
//         $("#htmlTemplateModalBody").empty();
//         // Create a row for the Bootstrap card layout
//         let row = $('<div class="row row-cols-1 row-cols-md-2 g-4"></div>');
//         $("#htmlTemplateModalBody").append(row);
//         templateList.forEach((template, index) => {
//           let preview = `
//           <div class="col">
//             <div class="card h-200">
//               <div class="card-body">
//                 <h5 class="card-title">${template.template_name}</h5>
//                 <p class="card-detail">수정일: ${
//                   template.update_date !== null
//                     ? formatDate(template.update_date)
//                     : "없음"
//                 }</p>
//                 <p class="card-detail">등록일: ${
//                   template.regdate !== null
//                     ? formatDate(template.regdate)
//                     : "없음"
//                 }</p>
//                 <p class="card-text">${template.template}</p>
//                 <div class="d-flex justify-content-center text-center">
//                   <div class="btn-group btn-group-sm mt-2">
//                     <button type="button" class="btn btn-primary select-template" data-template-id="${
//                       template.no
//                     }">Select</button>
//                     <button type="button" class="btn btn-danger delete-template" data-template-id="${
//                       template.no
//                     }">Delete</button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>`;
//           row.append(preview);
//         });

//         let htmlModal = new bootstrap.Modal($("#htmlTemplateModal"));
//         $("#htmlTemplateModalLabel").text("HTML Template List");
//         htmlModal.show();
//       }
//     },
//     error: (xhr, status, error) => {
//       console.error(xhr);
//       console.error(status);
//       console.error(error.message);
//     },
//   });
// }

// ajax function getSenderTemplateAll()
function getSenderTemplateAll() {
  $.ajax({
    type: "post",
    url: "/db/getSenderTemplateAll",
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        templateList = response.data;
        createTemplate(templateList);
        $("#htmlTemplateModalLabel").text("HTML Template List");
        $("#htmlTemplateModal").modal("show");
        setTimeout(() => {
          $("#template-search").trigger("focus");
        }, 500);
      } else {
        alert("템플릿 정보를 가져오는데 실패했습니다.\n" + response.message);
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
    },
  });
}

function createTemplate(templateList) {
  $("#htmlTemplateModalBody").empty();
  const row = $(`<ul class="list-group" id="template-list"></ul>`);
  $("#htmlTemplateModalBody").append(row);

  templateList.forEach((template, index) => {
    const preview = `
      <div class="d-flex justify-content-start template-row">
      <input type="checkbox" class="form-check-input me-2 place-self-center" id=template${template.no} data-no=${template.no} data-template-id=${template.template_no}>
      <li class="list-group-item w-100 ellipsis" id=template${template.no}>
        <div class="fw-bold fs-6 template-name">${template.name} - ${template.template_name}
          <a href='#' class="btn stretched-link select-template p-0" data-bs-target="#toggleModal" data-no=${template.template_no}></a>
        </div>
        <div class="ellipsis">${template.template_subject}</div>
      </li>
      </div>
    `;
    $("#template-list").append(preview);
  });
}

function createFilterList(filterList) {
  $("#filterTemplateModalBody").empty();
  const row = $(`<ul class="list-group" id="filter-list"></ul>`);
  $("#filterTemplateModalBody").append(row);

  if (filterList.length === 0) {
    return $("#filter-list").append(
      `<li class="list-group-item w-100 fw-bold">필터가 없습니다.</li>`
    );
  }

  filterList.forEach((filterSet, index) => {
    const preview = `
      <div class="d-flex justify-content-start filter-row">
      <input type="checkbox" class="form-check-input me-2 place-self-center" id=filter${filterSet.no} data-no=${filterSet.no}>
      <li class="list-group-item w-100 ellipsis" id=filterLi${filterSet.no}>
        <div class="fw-bold fs-6 filter-name">${filterSet.filter_name}
          <a href='#' class="btn stretched-link select-filter p-0" data-bs-target="#filterTemplateModal" data-no=${filterSet.no}></a>
        </div>
        <div class="ellipsis filter-area"></div>
      </li>
      </div>
    `;
    $("#filter-list").append(preview);
    const badgeSet = createFilterBadgeInTemplateList(
      JSON.parse(filterSet.filter_obj)
    );
    $(".filter-area").eq(index).append(badgeSet);
  });
}

function checkHtmlTemplate(templateName) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "post",
      url: "/db/checkHtmlTemplate",
      data: { templateName, senderId },
      dataType: "json",
      success: async (response) => {
        if (Object.keys(response).length === 0) {
          resolve(false);
        } else {
          resolve(true);
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

function deleteHtmlTemplate(templateName) {
  $.ajax({
    type: "post",
    url: "/db/deleteHtmlTemplate",
    data: { templateName, senderId },
    dataType: "json",
    success: function (response) {
      if (response) {
        showToast("삭제되었습니다.", "info");
        $("#htmlTemplateModal").modal("hide");
      }
    },
  });
}

// function updateHtmlTemplate(templateName, contents, senderId, subject) {
function updateHtmlTemplate(templateName, contents, senderId, subject) {
  $.ajax({
    type: "post",
    url: "/db/updateHtmlTemplate",
    data: { templateName, contents, senderId, subject },
    dataType: "json",
    success: function (response) {
      if (response) {
        showToast("본문 내용이 업데이트 되었습니다.", "info");
        hideLoading();
        return;
      }
    },
    error: (xhr, status, error) => {
      showToast("본문 업데이트 중 오류가 발생했습니다.", "danger");
      console.error(xhr);
      console.error(status);
      console.error(error.message);
      hideLoading();
      return;
    },
  });
}

// ajax call to updateHtmlTemplateContents(no, innerHTML)
function updateHtmlTemplateContents(no, templateName, mailTitle, innerHTML) {
  $.ajax({
    type: "post",
    url: "/db/updateHtmlTemplateContents",
    data: { no, templateName, mailTitle, innerHTML },
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        showToast("본문 내용이 업데이트 되었습니다.", "info");
        quill2 = null;
        $("#editor2").remove();

        $("#toggleModal-title").html("");

        selectedTemplateName = templateName;
        $("#toggleModal-title").text(
          selectedTemplateName + TEXT_DIVIDER + mailTitle
        );

        $("#toggleModal .modal-body").empty();
        $("#toggleModal .modal-body").append(innerHTML);

        $("#save-template").addClass("visually-hidden");
        $(".select-template").removeClass("visually-hidden");
        $("#edit-template").removeClass("visually-hidden");

        templateList = templateList.map((template) => {
          if (template.template_no == no) {
            return {
              ...template,
              template_subject: mailTitle,
              template_name: templateName,
            };
          } else {
            return template;
          }
        });
      }
    },
    error: (xhr, status, error) => {
      alert("본문 업데이트 중 오류가 발생했습니다.");
      console.error(xhr);
      console.error(status);
      console.error(error.message);
    },
  });
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

function setMinValue() {
  let dateElement = $("#sendStartTimeInput");
  let date = new Date(
    new Date().getTime() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, -5);
  dateElement.attr("min", date);

  const allowedTimeRange = getAllowedTimeZone();
  const selectedTime = new Date(dateElement.val());

  if (
    dateElement.val() < date ||
    !isTimeWithinAllowedRange(selectedTime, allowedTimeRange)
  ) {
    showToast(
      `1. 현재 시간보다 이전의 날짜는 설정할 수 없으며\n2. 발송 가능한 시간 범위 내에서 선택해야 합니다.`,
      "warning"
    );
    dateElement.val(date);
  }
}

function calcTakeTime(timeInSeconds) {
  const hours = Math.floor(timeInSeconds / 3600);
  timeInSeconds = timeInSeconds % 3600;
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;

  let formatted = `${seconds}s`;
  if (minutes) formatted = `${minutes}m ` + formatted;
  if (hours) formatted = `${hours}h ` + formatted;

  return formatted;
}

function dbMailSendingReg(transInfo) {
  localStorage.setItem("transInfo", JSON.stringify(transInfoBackup));
  let startTime = new Date().getTime();
  $.ajax({
    type: "post",
    url: "/db/dbMailingRegistration",
    data: { transInfo },
    dataType: "json",
    success: function (response) {
      if (response) {
        let endTime = new Date().getTime();
        showToast("발송 메일 등록이 완료되었습니다.", "info");
        let timeTaken = (endTime - startTime) / 1000;
        timeTaken = calcTakeTime(timeTaken);
        console.log("Time taken for DB Reg AJAX call: " + timeTaken);

        localStorage.removeItem("transInfo");
        for (const key in transInfoBackup) {
          delete transInfoBackup[key];
        }
        console.log("Backup Obj reset: ", transInfoBackup);
      } else {
        showToast("발송 메일 등록 실패. 관리자에게 문의 주세요", "danger");
      }
      setTimeout(() => {
        hideLoading();
      }, 300);
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.stack);
      showToast("발송 메일 등록 실패: " + error, "danger");
      alert("발송 메일 등록 실패: " + error);
      setTimeout(() => {
        hideLoading();
      }, 300);
    },
  });
}

/**
 * Check if it's a scheduled or immediate transfer
 * @param {String} yesOrNo Y or N
 * @returns Object
 */
function preparingSendMail(yesOrNo) {
  let idList;
  let reservation_sent;
  let send_status;
  let idListBackup;
  let sentIdBackup;

  const subject = $("#subjectInput").val();
  const senderName = $("#senderName").val();
  const innerHTML = quill.root.innerHTML;
  const senderGroup = $("#senderGroup").val();
  // const theme = $("#theme").val();

  isReadyToSendMail.isReady = true;

  if (yesOrNo == "Y") {
    reservation_sent = "Y";
    send_status = "scheduled";
  } else {
    reservation_sent = "N";
    send_status = "immediately";
  }

  if (senderId === undefined) {
    isReadyToSendMail.emptyResource = "발송기를 선택해주세요.";
    isReadyToSendMail.isReady = false;
  }

  if (senderEmailInfo?.length === 0) {
    isReadyToSendMail.isReady = false;
  }

  if (loadManager.getItem(strSearchResults).length == 0) {
    isReadyToSendMail.emptyResource = "수집된 ID가 없습니다.";
    isReadyToSendMail.isReady = false;
  } else {
    idList = loadManager.getItem(strSearchResults);
    idListBackup = [...idList];
    idList = idList.map((list) => {
      return list.id;
    });
  }

  const sentId = loadManager.getItem(strExistIdLists) || [];
  sentIdBackup = [...sentId];

  senderEmailInfo = loadManager.getItem(strSenderEmail);

  if (senderEmailInfo.length === 0) {
    isReadyToSendMail.emptyResource = "발송 계정이 없습니다.";
    isReadyToSendMail.isReady = false;
  }

  if (subject == "") {
    isReadyToSendMail.emptyResource = "제목을 입력해주세요.";
    isReadyToSendMail.isReady = false;
  }

  if (senderName == "") {
    isReadyToSendMail.emptyResource = "발송명을 입력해주세요.";
    isReadyToSendMail.isReady = false;
  }

  if (senderGroup == "") {
    isReadyToSendMail.emptyResource = "발송그룹명을 입력해주세요.";
    isReadyToSendMail.isReady = false;
  }

  if (innerHTML == "<div><br></div>") {
    isReadyToSendMail.emptyResource = "본문을 입력해주세요.";
    isReadyToSendMail.isReady = false;
  }
  const transInfo = {
    senderId,
    idList,
    senderName,
    senderGroup,
    subject,
    innerHTML,
    senderEmailInfo,
    // dispatch_registration_time, // 이후 단계에서 추가
    reservation_sent,
    send_status,
  };

  transInfoBackup = {
    senderId,
    idListBackup,
    sentIdBackup,
    senderName,
    senderGroup,
    subject,
    innerHTML,
    senderEmailInfo,
    reservation_sent,
    send_status,
    // theme,
  };

  return transInfo;
}

function insertKeyWord(keyword, senderId) {
  $.ajax({
    type: "post",
    url: "/db/insertKeyWord",
    data: { keyword, senderId },
    dataType: "json",
    success: function (response) {
      if (response) {
        updateKeywordList(senderId);
        $("#addKeywordInput").focus();
      } else {
        showToast("키워드 추가에 문제 발생", "danger");
        return;
      }
    },
    error: function (xhr, status, error) {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
    },
  });
}

function deleteKeyWord(no) {
  $.ajax({
    type: "post",
    url: "/db/deleteKeyWord",
    data: { no },
    dataType: "json",
    success: function (response) {
      if (response) {
        updateKeywordList(senderId);
      } else {
        return false;
      }
    },
  });
}

function getKeyWordList(senderId) {
  let keywordList;
  $.ajax({
    type: "post",
    url: "/db/getKeyWord",
    dataType: "json",
    data: { senderId },
    async: false,
    success: (response) => {
      keywordList = response;
    },
    error: (xhr, status, error) => {
      console.log("ajax error: ", error);
    },
  });
  return keywordList;
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

function deleteKeyWordList(noList) {
  $.ajax({
    type: "post",
    url: "/db/deleteKeyWordList",
    data: { noList },
    dataType: "json",
    success: function (response) {
      updateKeywordList(senderId);
    },
  });
}

async function getSuperIds() {
  let res = [];
  $.ajax({
    type: "post",
    url: "/db/getSuperIds",
    dataType: "json",
    async: false,
    success: function (response) {
      if (response) {
        res = response;
      }
    },
  });
  return res;
}

function isValidID(id) {
  const regex = /^[a-z0-9][a-z0-9-_.]{1,19}$/;
  return regex.test(id);
}

// get specific template subject and contents from ajax call
function getSpecificTemplate(no) {
  $.ajax({
    type: "post",
    url: "/db/getSpecificTemplate",
    data: { no },
    dataType: "json",
    async: false,
    success: function (response) {
      if (response.isSuccess) {
        const data = response.data;
        selectedTemplateContents = data.template;
        $("#template-id").val(data.no);
        $("#toggleModal-title").text(
          data.template_name + TEXT_DIVIDER + data.template_subject
        );
        $("#toggleModal .modal-body").html(data.template);

        $("#htmlTemplateModal").modal("hide");
        $("#toggleModal").modal("show");
      }
    },
  });
}

function deleteHtmlTemplateList(noList) {
  $.ajax({
    type: "post",
    url: "/db/deleteHtmlTemplateList",
    data: { noList },
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        showToast("템플릿이 삭제되었습니다.", "info");
        $("#template-list input[type=checkbox]:checked").each(function (
          index,
          element
        ) {
          $(element).parent(".template-row").remove();
        });
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
      showToast("템플릿 삭제 중 오류가 발생했습니다.", "danger");
    },
  });
}

function deleteSpecificFilterList(noList) {
  $.ajax({
    type: "post",
    url: "/db/deleteSpecificFilterList",
    data: { noList },
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        showToast("필터가 삭제되었습니다.", "info");
        $("#filter-list input[type=checkbox]:checked").each(function (
          index,
          element
        ) {
          $(element).parent(".filter-row").remove();
        });
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
      showToast("필터 삭제 중 오류가 발생했습니다.", "danger");
    },
  });
}

// ajax call All of mail_google_sender
function getSenderEmails() {
  $.ajax({
    type: "post",
    url: "/db/getSenderEmails",
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        senderEmailTotal = response.data;
        $("#sender-list .badge").text(senderEmailTotal.length);
        const senderEmailList = createSenderEmailList(senderEmailTotal);
        $("#senderTotalList").append(senderEmailList);
        toggleSenderSwitch();
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
    },
  });
}

function createSenderEmailList(senderEmails, insertId) {
  let list = "";

  // 도메인 우선 정렬
  const sortedEmails = Array.isArray(senderEmails)
    ? senderEmails.sort((a, b) => {
      const [, domainA] = a.id.split('@');
      const [, domainB] = b.id.split('@');
      const [userA] = a.id.split('@');
      const [userB] = b.id.split('@');

      // 도메인으로 먼저 비교
      if (domainA !== domainB) {
        return domainA.localeCompare(domainB);
      }
      // 도메인이 같은 경우 사용자명으로 비교
      return userA.localeCompare(userB);
    })
    : [];

  console.log("Sorted Emails:", sortedEmails);

  sortedEmails.forEach((senderEmail) => {
    const [, domain] = senderEmail.id.split('@');
    let color = "black"; // 기본 색상

    if (domain.includes("naver")) {
      color = "green";
    } else if (domain.includes("gmail")) {
      color = "blue";
    } else if (senderEmail.id.includes("reviewnavi")) {
      color = "black";
    }

    list += `<div class="form-check form-switch p-0 g-0 mt-1">
      <li class="list-group-item d-flex justify-content-start p-1 w-auto">
      <input class="form-check-input sender-switch ms-0 me-2" type="checkbox" role="switch" id='email-${senderEmail.no}'
      data-email=${senderEmail.id} ${senderId == undefined ? "disabled" : ""}>
      <label class="form-check-label" for="${senderEmail.id}" style="color: ${color};">${senderEmail.id}</label>
      </li></div>`;
  });

  if (sortedEmails.length === 0) {
    list = `<div class="form-check form-switch p-0 g-0 mt-1">
    <li class="list-group-item d-flex justify-content-start p-1 w-auto">
    <input class="form-check-input sender-switch ms-0 me-2" type="checkbox" role="switch" id='email-${insertId}' data-email=${senderEmails} ${senderId == undefined ? "disabled" : ""}>
    <label class="form-check-label" for="${senderEmails}">${senderEmails}</label>
    </li></div>`;
  }
  return list;
}

function switchOff(target) {
  $(".sender-switch").each(function () {
    if ($(this).data("email") === target) {
      $(this).prop("checked", false);
    }
  });
}

function switchOn(target) {
  $(".sender-switch").each(function () {
    if ($(this).data("email") === target) {
      $(this).prop("checked", true);
    }
  });
}

function toggleSenderSwitch() {
  if ($("#selectedSender").val() == "") {
    $(".sender-switch").prop("disabled", true);
  } else {
    $(".sender-switch").prop("disabled", false);
  }
}

function markCheckedSenderEmails(arrOfEmail) {
  const checkedItems = [];

  $("#senderTotalList li").each(function (index, element) {
    const $listItem = $(element);
    const $divWrapper = $listItem.closest(".form-check");

    const $checkbox = $divWrapper.find(".form-check-input");
    const email = $divWrapper.find("label").text();

    if (arrOfEmail.includes(email)) {
      $checkbox.prop("checked", true);
      checkedItems.push($divWrapper.detach());
    } else {
      $checkbox.prop("checked", false);
    }
  });
  checkedItems.forEach(function (item) {
    $("#senderTotalList").prepend(item);
    // $(".mail-test").after(item);
  });
}

function insertSenderEmailAgent(senderEmail, mail_no, agent_no) {
  // if (agent_no === undefined || agent_no === null) {
  //   agent_no = senderId;
  // }

  $.ajax({
    type: "post",
    url: "/db/insertSenderEmailAgent",
    data: { mail_no, agent_no },
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        showToast(`발송 계정(${senderEmail})이 활성화되었습니다.`, "info");
        const senderList = loadManager.getItem(strSenderEmail);
        loadManager.setItem(strSenderEmail, [
          ...new Set([...senderList, senderEmail]),
        ]);
        senderEmailInfo = loadManager.getItem(strSenderEmail);
        switchOn(senderEmail);
        $("#mailId .badge").text(senderList.length + 1);

        const $enderName = $("#selectedSender").val().split(".")[1].trim();
        findEmailAddBadge(mail_no, $enderName, agent_no);

        socket.emit("assigned", {
          senderEmail,
          agent_no,
          mail_no,
          senderName: $enderName,
        });
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
      showToast(
        `발송 계정${senderEmail} 활성화 중 오류가 발생했습니다.`,
        "danger"
      );
      switchOff(senderEmail);
    },
  });
}

function disableSenderEmailAgent(senderEmail, mail_no, agent_no) {
  if (agent_no === undefined || agent_no === null) {
    agent_no = senderId;
  }

  $.ajax({
    type: "post",
    url: "/db/disableSenderEmailAgent",
    data: { mail_no, agent_no },
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        showToast(
          `발송 계정(${senderEmail})이 현재 발송기에서 비활성화 되었습니다.`,
          "warning"
        );
        const senderList = loadManager.getItem(strSenderEmail);
        loadManager.setItem(
          strSenderEmail,
          senderList.filter((sender) => sender !== senderEmail)
        );
        senderEmailInfo = loadManager.getItem(strSenderEmail);
        switchOff(senderEmail);
        $("#mailId .badge").text(senderList.length - 1);
        const $enderName = $("#selectedSender").val().split(".")[1].trim();

        findEmailRemoveBadge(mail_no, agent_no);

        socket.emit("unassigned", {
          senderEmail,
          agent_no,
          mail_no,
          senderName: $enderName,
        });
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
      showToast(
        `발송 계정(${senderEmail}) 비활성화 중 오류가 발생했습니다.`,
        "danger"
      );
      switchOn(senderEmail);
    },
  });
}

function removeSenderEmail(senderEmail) {
  const senderEmails = loadManager.getItem(strSenderEmail);
  const updatedSenderMail = senderEmails.filter((email) => {
    return email !== senderEmail ? true : false;
  });

  loadManager.setItem(strSenderEmail, updatedSenderMail);
  updateSearchResult(strSenderEmail, 2, senderIdList);

  senderEmailInfo = senderEmailInfo.filter((info) => {
    return info.id !== senderEmail;
  });

  senderEmailTotal = senderEmailTotal.filter((info) => {
    return info.id !== senderEmail;
  });

  $(".form-switch .sender-switch").each(function () {
    const $this = $(this);
    const $parentLi = $this.closest(".form-switch");
    const id = $this.data("email");
    if (id === senderEmail) {
      $parentLi.remove();
    }
  });

  if (senderEmails.some((email) => email === senderEmail)) {
    $("#mailId .badge").text(senderEmailInfo.length);
  }
  $("#sender-list .badge").text(senderEmailTotal.length);
}

function unassignAllEmails() {
  $.ajax({
    type: "post",
    url: "/db/unassignAllEmails",
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        showToast("모든 발송 계정이 비활성화 되었습니다.", "danger");
        loadManager.removeItem(strSenderEmail);
        updateSearchResult(strSenderEmail, 2, senderIdList);
        $(".form-switch .sender-switch").each(function () {
          $(this).prop("checked", false);
          $(this).siblings(".agent-badge").remove();
        });
        $("#mailId .badge").text("0");
        socket.emit("unassignAll");
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
      showToast("모든 발송 계정 비활성화 중 오류가 발생했습니다.", "danger");
    },
  });
}

// ajax for isEmailUsing(email)
function isEmailUsing(email) {
  let res;
  $.ajax({
    type: "post",
    url: "/db/isEmailUsing",
    data: { email },
    async: false,
    dataType: "json",
    success: function (response) {
      res = response.data[0];
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
    },
  });
  return res;
}

// ajax for getCurrentMailAllocationStatus()
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

function findEmailAddBadge(mail_no, agentName, agent_no) {
  $(".form-switch .sender-switch").each(function () {
    const $thisMailNo = $(this).attr("id").split("-")[1].trim();
    if ($thisMailNo == mail_no) {
      const badge = createBadgeForSenderEmail(agentName, agent_no);
      $(this).parent().append(badge);
    }
  });
}

function findEmailEditBadge(agentName, agent_no) {
  $(".form-switch .sender-switch").each(function () {
    $(this)
      .siblings(".agent-badge")
      .each(function () {
        if ($(this).data("agent") == agent_no) {
          $(this).text(agentName);
        }
      });
  });
}

function findEmailRemoveBadge(mail_no, agent_no) {
  $(".form-switch .sender-switch").each(function () {
    const $thisMailNo = $(this).attr("id").split("-")[1].trim();
    if ($thisMailNo == mail_no) {
      $(this)
        .siblings(".agent-badge")
        .each(function () {
          if ($(this).data("agent") == agent_no) {
            $(this).remove();
          }
        });
    }
  });
}

function getAgentList() {
  $.ajax({
    type: "post",
    url: "/db/getAgentList",
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        const agentList = response.data;
        const li = createDropdownList(agentList);
        $("#agent-dropdown-menu").append(li);
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
      showToast("에이전트 정보를 가져오는데 실패했습니다.", "danger");
    },
  });
}

function getStoreList() {
  $.ajax({
    type: "post",
    url: "/db/getStoreList",
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        const storeList = response.data;
        const li = createDropdownList(storeList);
        $("#store-dropdown-menu").append(li);
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
      showToast("점포 정보를 가져오는데 실패했습니다.", "danger");
    },
  });
}

function createDropdownList(listData) {
  let dropdownList = "";
  listData.forEach((item) => {
    const name = item.name.replaceAll(" ", "");
    let m_name =
      item.m_name == null
        ? ""
        : "data-mname=" + item.m_name.replaceAll(" ", "");
    dropdownList += `<li class="list-group-item" id=${name} data-name=${name} ${m_name} data-no=${item.no}><a class="dropdown-item" href="#">${item.name}</a></li>`;
  });
  return dropdownList;
}

function usersWhoHaveAlreadyJoined(date, agentNoArr, storeNoArr) {
  $.ajax({
    type: "post",
    url: "/db/usersWhoHaveAlreadyJoined",
    data: { date, agent_no: agentNoArr, store_no: storeNoArr },
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        const filteredUsers = response.data;
        const searchedUsers = loadManager.getItem(strSearchResults);
        // const filteredIds = filteredUsers.map((user) => user.blog_id);

        searchedUsers.forEach((user) => {
          filteredUsers.forEach((filteredUser) => {
            if (user.id === filteredUser.blog_id) {
              user.status = filteredUser.status;
            }
          });
        });

        loadManager.setItem(strSearchResults, searchedUsers);
        updateSearchResult(strSearchResults, 0, idSearchResult);
        $("#collectedId .badge").text(searchedUsers.length);

        showToast("선택된 필터가 수집ID에 적용되었습니다.", "info");
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr.responseJSON.message);
      console.error(status);
      console.error(error.message);
      showToast("이미 가입한 사용자 정보를 가져오는데 실패했습니다.", "danger");
    },
  });
}

function setTimeTodayInFilter() {
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  $("#filter-date").val(formattedDate);
}

function removeJoinedUser() {
  const searchedUsers = loadManager.getItem(strSearchResults);
  const summary = searchedUsers.filter((user) => {
    return !user.status > 3 || user.status === undefined;
  });

  loadManager.setItem(strSearchResults, summary);
  updateSearchResult(strSearchResults, 0, idSearchResult);
  $("#collectedId .badge").text(summary.length);

  showToast("기존에 참여한 사용자가 제거되었습니다.", "info");
}

function addNewHiworksMail(email, password) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "post",
      url: "/mail/addNewHiworksMail",
      data: { email, password, mySocketId },
      dataType: "json",
      success: function (response) {
        if (response.isSuccess) {
          resolve(response);
        }
      },
      error: (xhr, status, error) => {
        console.error(xhr);
        console.error(status);
        console.error(error.message);
        reject(xhr.responseJSON.message);
      },
    });
  });
}

function getFilterTemplateAll() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "post",
      url: "/db/getFilterTemplateAll",
      dataType: "json",
      success: function (response) {
        if (response.isSuccess) {
          filterTemplateList = response.data;
          createFilterList(response.data);
          $("#filterTemplateModalLabel").text("Filter Template List");
          $("#filterTemplateModal").modal("show");
          resolve();
        }
      },
      error: (xhr, status, error) => {
        console.error(xhr);
        console.error(status);
        console.error(error.message);
        reject(error.message);
      },
    });
  });
}

// ajax for saveFilterTemplate(filterName, array of objects)
function setFilterTemplate(filterName, filterArray) {
  $.ajax({
    type: "post",
    url: "/db/setFilterTemplate",
    data: { filterName, filterArray },
    dataType: "json",
    success: function (response) {
      if (response.isSuccess) {
        showToast("Filter Template이 저장되었습니다.", "info");
        $("#filterTemplateModal").modal("hide");
      }
    },
    error: (xhr, status, error) => {
      console.error(xhr);
      console.error(status);
      console.error(error.message);
      showToast("Filter Template 저장 중 오류가 발생했습니다.", "danger");
    },
  });
}

/**
 *
 * @param {Array} filterObj
 * @returns {String} badgeList
 */
function createFilterBadgeInTemplateList(filterObj) {
  let badgeList = "";
  filterObj.forEach((obj) => {
    const { type, no, name, date } = obj;
    if (type !== "period") {
      badgeList += `<span class="badge text-bg-${type} text-dark m-1 align-align-self-center" id=${name} data-${type}=${no}>${name}</span>`;
    } else {
      let dateStr = "기간: ";
      switch (date) {
        case "":
          dateStr += "전체";
          break;
        case "0":
          dateStr += "오늘";
          break;
        case "-3":
          dateStr += "3개월 전";
          break;
        case "-6":
          dateStr += "6개월 전";
          break;
        case "-12":
          dateStr += "1년 전";
          break;
      }

      badgeList += `<span class="badge rounded-pill text-bg-light m-1 align-align-self-center" data-month=${date}>${dateStr}</span>`;
    }
  });

  return badgeList;
}

/**
 *
 * @param {Array} filterObjArr
 */
function createFilterBadge(filterObjArr, no) {
  filterObjArr.forEach((filterObj) => {
    if (no == filterObj.no) {
      JSON.parse(filterObj.filter_obj).forEach((obj) => {
        const { type, no, name, date } = obj;

        if (type !== "period") {
          const badge = `<span class="badge text-bg-${type} text-dark m-1 align-align-self-center" id=${name} data-${type}=${no}>${name}<button class="btn-close fw-bold" id="remove-badge">X</button></span>`;
          $("#tag-area").append(badge);
        } else {
          const dateNum = Number(date);
          const today = new Date();
          filterPeriod = isNaN(dateNum) ? null : dateNum;

          if (isNaN(dateNum) || dateNum == "") {
            return $("#filter-date").val("");
          }
          const newDate = new Date(
            today.getFullYear(),
            today.getMonth() + dateNum,
            today.getDate() + 1
          );

          const formattedNewDate = newDate.toISOString().split("T")[0];
          $("#filter-date").val(formattedNewDate);
        }
      });
    }
  });
}

function insertContentAtCursor(content) {
  if (lastCursorPosition !== null) {
    quill.clipboard.dangerouslyPasteHTML(lastCursorPosition, content);
    quill.setSelection(lastCursorPosition + content.length);
  } else {
    const length = quill.getLength() - 1;
    quill.clipboard.dangerouslyPasteHTML(length, content);
    quill.setSelection(length + content.length);
  }
}

function deleteEmailFromHiworks(willRemoveEmail) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "post",
      url: "/mail/deleteEmailFromHiworks",
      data: { willRemoveEmail },
      dataType: "json",
      success: function (response) {
        if (response.isSuccess) {
          resolve(response.isSuccess);
        }
      },
      error: (xhr, status, error) => {
        console.error(xhr);
        console.error(status);
        console.error(error.message);
        reject(xhr.responseJSON.message);
      },
    });
  });
}

function loadSuperAccounts() {
  $.get('/db/super-account-list', function (accounts) {
    const $list = $('#superAccountList').empty();
    accounts.forEach(account => {
      $list.append(createAccountItem(account));
    });
  });
}

function createAccountItem(account) {
  /*
    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="account-${account.no}">
        <label class="form-check-label" for="account-${account.no}">
          ${account.super_id}
        </label>
      </div>
  */
  return `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <div class="form-check">
        <label class="form-check-label" id="account-${account.no}">
          ${account.super_id}
        </label>
      </div>
      <div>
        <div class="form-check form-switch d-inline-block me-2">
          <input class="form-check-input toggle-emergency" type="checkbox" role="switch" 
                 id="emergency-${account.no}" ${account.is_emergency === 'Y' ? 'checked' : ''}
                 data-id="${account.no}"
                 title="발송 메일에 해당 계정이 존재할 경우 즉시 메일을 발송합니다."
                 >
          <label class="form-check-label" for="emergency-${account.no}">즉시 발송</label>
        </div>
        <button class="btn btn-danger btn-sm delete-super-account" data-id="${account.no}">삭제</button>
      </div>
    </li>
  `;
}

function addSuperAccount() {
  const superId = $('#newSuperAccount').val().trim();
  if (superId) {
    $.post('/db/super-account-add', { superId }, function (newAccount) {
      console.log("indexFunctions.js/:2477 - newAccount: ", newAccount);
      $('#superAccountList').append(createAccountItem(newAccount));
      $('#newSuperAccount').val('');
    });
  }
}

function deleteSuperAccount() {
  const id = $(this).data('id');
  $.ajax({
    url: `/db/super-account-delete/${id}`,
    type: 'DELETE',
    success: function () {
      $(`#account-${id}`).closest('li').remove();
    }
  });
}

function toggleEmergency() {
  const id = $(this).data('id');
  const isEmergency = $(this).prop('checked');
  $.ajax({
    url: `/db/super-account-toggle/${id}`,
    type: 'PUT',
    data: { isEmergency },
    success: function () {
      // 토글 상태가 성공적으로 변경되었습니다.
    }
  });
}

function updateSenderList() {
  const senderEmails = loadManager.getItem(strSenderEmail);
  $("#senderTotalList").empty();

  // 도메인 우선 정렬
  const sortedEmails = senderEmails.sort((a, b) => {
    const [, domainA] = a.split('@');
    const [, domainB] = b.split('@');
    const [userA] = a.split('@');
    const [userB] = b.split('@');

    console.log(`Comparing domains: ${domainA} vs ${domainB}`);
    console.log(`Comparing users: ${userA} vs ${userB}`);

    // 도메인으로 먼저 비교
    if (domainA !== domainB) {
      return domainA.localeCompare(domainB);
    }
    // 도메인이 같은 경우 사용자명으로 비교
    return userA.localeCompare(userB);
  });

  console.log("Sorted Emails:", sortedEmails);

  sortedEmails.forEach((email, index) => {
    const listItem = `
      <div class="d-flex justify-content-between align-items-center border-bottom py-2">
        <div class="d-flex align-items-center">
          <span class="me-2">${index + 1}.</span>
          <span>${email}</span>
        </div>
        <div>
          <button class="btn btn-outline-primary btn-sm me-1" onclick="senderTestMail('${email}')">Test</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteSenderEmail('${email}')">Delete</button>
        </div>
      </div>`;
    $("#senderTotalList").append(listItem);
  });

  $("#senderCount").text(sortedEmails.length);
}