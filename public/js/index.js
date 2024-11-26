const strSearchResults = "searchResults";
const strExistIdLists = "existIdLists";
const strSenderEmail = "senderEmail";
const strKeyword = "keyword";
const YES = "Y";
const NO = "N";
const tabLinks = $(".nav-link");
const idSearchResult = $("#searchResult");
const sentIdList = $("#sentIdList");
const senderIdList = $("#senderIdList");
const senderTotalList = $(".mail-control");
const TEXT_DIVIDER = "  |  ";
const linkRegex = /(<a[^>]*>)(.*<\/a>)/gm;
const socket = io();
let mySocketId;

let senderId;
let selectedId;
let senderEmailInfo = {};
let templateList = [];
let transInfo;
let quill;
let quill2;
let lastCursorPosition = null;
let selectedKeywords = [];
let isReadyToSendMail = {};
let timeZ;
let selectedTemplateName;
let selectedTemplateContents;
let toolbarOptions;
let senderEmailTotal;
let [email, domain] = [null, null];
let selectedSenderName;
let filterPeriod = 0;
let filterTemplateList;

const createBadgeForSenderEmail = (name, agent_no) =>
  `<span class="badge agent-badge text-bg-warning bg-opacity-50 text-opacity-75 ms-2" data-agent=${agent_no}>${name}</span>`;

const checkInfoForSendMail = (emptyResource) => {
  console.log("isReadyToSendMail: ", isReadyToSendMail);
  console.log("transInfo: ", transInfo);
  return showToast(
    `발송에 필요한 아래 정보를 확인하십시오\n${emptyResource}`,
    "warning"
  );
};

async function delay(interval) {
  return new Promise((resolve) => setTimeout(resolve, interval));
}

$(document).ready(async function() {
  console.log("loaded index.js");
  loadManager.clear();

  function adjustHeight() {
    const totalHeight = $("#search-panel").outerHeight(true);
    const areaHeight = $(".area-wrapper").outerHeight(true);
    // const resultHeight = $(".result").outerHeight();
    const navPillsHeight = $(".nav-pills").outerHeight(true);
    // const mcHeight = $(".mail-control").outerHeight(false);
    const mailTestAreaHeight = $(".mail-add-test-area").outerHeight(true);
    const availableHeight =
      totalHeight - areaHeight - navPillsHeight - mailTestAreaHeight;

    $("#senderTotalList").outerHeight(availableHeight);

    const mailBtnAreaHeight = $(".mail-btn-area").outerHeight(true);
    const calc = availableHeight + mailBtnAreaHeight * 2;
    $("#editor").height(calc);

    $(".nav-item").each(function(index) {
      if (index <= 2) {
        $("select").outerHeight(availableHeight + mailTestAreaHeight);
      }
    });
  }

  adjustHeight();

  $(window).on("resize", adjustHeight);

  $("#manualAdd").val("jknyun,jtuk07");

  idSearchResult.html(updateSearchResult(strSearchResults, 0, idSearchResult));

  if (localStorage.getItem("transInfo")) {
    const transInfoBackup = JSON.parse(localStorage.getItem("transInfo")) || {};
    if (Object.keys(transInfoBackup).length > 0) {
      const message = `발송 실패 데이터가 있습니다. 
      [확인]을 누르면 복구합니다.
      발송등록시각: ${formatDate(transInfoBackup.dispatch_registration_time)}
      발송그룹: ${transInfoBackup.senderGroup}
      발송이름: ${transInfoBackup.senderName}
      제목: ${transInfoBackup.subject}
      발송유형: ${
        transInfoBackup.reservation_sent === "Y" ? "예약발송" : "즉시발송"
      }`;

      if (confirm(message)) {
        // senderId
        senderId = transInfoBackup.senderId;
        // idList
        loadManager.setItem(strSearchResults, transInfoBackup.idListBackup);
        updateSearchResult(strSearchResults, 0, idSearchResult);
        // sentId
        loadManager.setItem(strExistIdLists, transInfoBackup.sentIdBackup);
        updateSearchResult(strExistIdLists, 1, sentIdList);
        // sensitiveInfo
        senderEmailInfo = transInfoBackup.senderEmailInfo;
        loadManager.setItem(strSenderEmail, senderEmailInfo);
        updateSearchResult(strSenderEmail, 2, senderIdList);

        fetch("/db/getOneSender", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ senderId: transInfoBackup.senderId }),
        })
        .then((response) => response.json())
        .then((data) => $("#selectedSender").val(data[0].name))
        .catch((error) => {
          console.error("Error:", error);
        });

        // senderName
        $("#senderName").val(transInfoBackup.senderName);
        // senderGroup
        $("#senderGroup").val(transInfoBackup.senderGroup);
        // subject
        $("#subjectInput").val(transInfoBackup.subject);
        // theme
        // $("#theme").val(transInfoBackup.theme);
        // innerHTML
        setTimeout(() => {
          quill.root.innerHTML = transInfoBackup.innerHTML;
        }, 500);
      } else {
        if (confirm("복원 데이터를 삭제 하시겠습니까?")) {
          localStorage.clear();
        }
      }
    }
  } else {
    // init call sender
    setTimeout(() => {
      $("#chooseSender").trigger("click");
    }, 300);
    getSenderEmails();
    const mailAllocationStatus = await getCurrentMailAllocationStatus();

    setTimeout(() => {
      if (mailAllocationStatus.length > 0) {
        $(".form-switch .sender-switch").each(function() {
          const mailNo = $(this).attr("id").split("-")[1].trim();
          mailAllocationStatus.forEach((dataSet) => {
            if (mailNo == dataSet.mail_no) {
              const badge = createBadgeForSenderEmail(
                dataSet.name,
                dataSet.agent_no
              );
              $(this).parent().append(badge);
            }
          });
        });
      }
    }, 500);
  }

  function resizeButtons() {
    if ($(window).width() < 450) {
      $("button").addClass("btn-sm");
    } else {
      $("button").removeClass("btn-sm");
    }
  }

  // Call the function on initial load
  resizeButtons();

  // Call the function when the window is resized
  $(window).on("resize", resizeButtons);

  let currentTime = getDate();
  $("#currentTime").val(currentTime);

  // Add a click event listener to the button
  $("#chooseSender").on("click", function() {
    const result = getSenderList();
    const senderNameNums = result.map((json) => ({
      no: json.no,
      name: json.name,
    }));
    $("#senderModalLabel").text("발송기 선택");
    const listItems = generateSenderListItems(senderNameNums);

    // add search bar
    const searchBar = `<div class="input-group">
          <input type="text" class="form-control" placeholder="발송기 검색" id="search-sender">
        </div>`;

    $(".sender-search-area").html(searchBar);

    $("#senderModal .modal-body ul").html(listItems);

    chooseSender();

    // Remove the click event listener for the Rename button before adding a new one
    $("#senderModal")
    .off("click", "#changeSenderName")
    .on("click", "#changeSenderName", function() {
      const listItem = $(this).closest("div.d-flex.justify-content-center");
      const [, agentName] = listItem
      .find("li.list-group-item")
      .text()
      .split(".");
      const senderId = listItem
      .find("input[name=\"listGroupRadio\"]")
      .data("senderid");

      const inputElement = $("<input>")
      .attr("type", "text")
      .attr("value", agentName.trim())
      .addClass("form-control");

      const saveButton = $("<button>")
      .attr("type", "button")
      .addClass("btn btn-danger")
      .text("Save");
      const cancelButton = $("<button>")
      .attr("type", "button")
      .addClass("btn btn-success ml-2")
      .text("Cancel");

      listItem.html(inputElement);
      listItem.append(saveButton);
      listItem.append(cancelButton);

      saveButton.on("click", function() {
        const newSenderName = inputElement.val().trim();
        const confirmMessage = `발송기 이름 '${agentName.trim()}' 에서 '${newSenderName}'로 변경 하시겠습니까?`;
        if (confirm(confirmMessage)) {
          updateSenderName(agentName, newSenderName, senderId);
          listItem.html(changedLiTag(newSenderName, senderId));
          chooseSender();
        }
      });

      cancelButton.on("click", function() {
        listItem.html(changedLiTag(agentName, senderId));
        chooseSender();
      });

      inputElement.on("click", function(event) {
        event.stopPropagation();
      });
    });
  });

  const doSearch = async () => {
    if (senderId === undefined) {
      showToast("발송기를 선택해주세요", "warning");
      hideLoading();
      return;
    }

    const keyword = $("#searchingForId").val();
    if (keyword == "" || keyword == " ") {
      hideLoading();
      return showToast("검색어를 입력하세요", "warning");
    } else {
      const arrOfKeyword = keyword.split(",").map((word) => word.trim());
      const keywordLength = arrOfKeyword.length;
      const storedKeyword = loadManager.getItem(strKeyword);
      const newArrKeyword = [...new Set([...arrOfKeyword, ...storedKeyword])];

      loadManager.setItem(strKeyword, newArrKeyword);

      const score1 = $("#score1").val();
      const score2 = $("#score2").val();

      if (score1 >= score2) {
        hideLoading();
        return showToast("지수 탐색 범위를 재확인 하십시오.", "warning");
      }

      // arrOfKeyword.forEach((keyword, index) =>
      for (const keyword of arrOfKeyword) {
        // await delay(500);
        await searchAjaxCall(keyword, score1, score2);
      }
      hideLoading();
    }
  };

  const searchAjaxCall = (keyword, score1, score2) => {
    return new Promise((resolve, reject) => {
      showLoading();
      $.ajax({
        url: "/crawling/search",
        type: "post",
        dataType: "json",
        timeout: 600000,
        data: { keyword: keyword, score1, score2, no: senderId, mySocketId },
      })
      .done((json) => {
        const searchResults = json.searchResults || [];
        if (searchResults.length === 0) {
          showToast("검색 결과: 0", "warning");
        }

        const willSend = searchResults.filter((item) => {
          return item.isSent === false && item.isUnsubscribe === false;
        });

        const alreadySent = searchResults.filter((item) => {
          return item.isSent === true || item.isUnsubscribe === true;
        });

        const collectedId = loadManager.getItem(strSearchResults);
        const sentId = loadManager.getItem(strExistIdLists);

        if (collectedId.length > 0) {
          const finalSortedId = mergeAndResolve(collectedId, willSend);
          loadManager.setItem(strSearchResults, finalSortedId);
        } else {
          loadManager.setItem(strSearchResults, willSend);
        }

        if (sentId.length > 0) {
          const finalSortedId = mergeAndResolve(sentId, alreadySent);
          loadManager.setItem(strExistIdLists, finalSortedId);
        } else {
          loadManager.setItem(strExistIdLists, alreadySent);
        }

        updateSearchResult(strExistIdLists, 1, sentIdList);
        updateSearchResult(strSearchResults, 0, idSearchResult);

        $("#searchingForId").val("");
        // setTimeout(() => {
        //   hideLoading();
        // }, 300);
        resolve();
      })
      .fail((xhr, status, errorThrown) => {
        console.error("search ajax failed: ", errorThrown);
        showToast(errorThrown, "danger");
        // setTimeout(() => {
        //   hideLoading();
        // }, 300);
        hideLoading();
        reject(errorThrown);
      });
    });
  };

  $(".addSearch").on("click", () => {
    setTimeout(() => {
      doSearch();
    }, 500);
  });

  $("#searchingForId").on("keypress", function(e) {
    if (e.key == "Enter") {
      e.stopPropagation();
      setTimeout(() => {
        doSearch();
      }, 500);
    }
  });

  $(".addManually").on("click", function() {
    showLoading();
    addManually();
    hideLoading();
  });

  $("#manualAdd").on("keypress", function(e) {
    if (e.key == "Enter") {
      showLoading();
      addManually();
      hideLoading();
    }
  });

  // init tabs
  hideAndSeek(idSearchResult, sentIdList, senderIdList, senderTotalList);

  tabLinks.on("click", function(e) {
    const index = tabLinks.index(this);
    // console.log("index: ", index);
    switch (index) {
      case 0:
        idSearchResult.html(
          updateSearchResult(strSearchResults, index, idSearchResult),
        );
        hideAndSeek(idSearchResult, sentIdList, senderIdList, senderTotalList);
        // mailListKeyDown(index);
        break;

      case 1:
        sentIdList.html(updateSearchResult(strExistIdLists, index, sentIdList));
        hideAndSeek(sentIdList, idSearchResult, senderIdList, senderTotalList);
        break;

      case 2:
        senderIdList.html(
          updateSearchResult(strSenderEmail, index, senderIdList),
        );
        // mailListKeyDown(index);
        $("option").on("dblclick", function() {
          const senderEmail = $(this).val();
          const message = `'${senderEmail}'으로 테스트 메일 발송?`;
          if (confirm(message)) {
            senderTestMail(senderEmail);
          }
        });
        hideAndSeek(senderIdList, idSearchResult, sentIdList, senderTotalList);
        break;

      case 3:
        hideAndSeek(senderTotalList, idSearchResult, sentIdList, senderIdList);
        break;

      default:
        hideAndSeek(idSearchResult, sentIdList, senderIdList, senderTotalList);
        break;
    }

    tabLinks.removeClass("active");
    $(this).addClass("active");
  });

  $("#searchResult").on("dblclick", "option", function() {
    const id = $(this).val().replace(" ", "").split("/")[0];
    const object = loadManager.getItemById(strSearchResults, id);
    if (object.url) {
      return window.open(object.url);
    } else {
      const blogUrl = `https://blog.naver.com/${id}`;
      return window.open(blogUrl);
    }
  });

  $("#reset").on("click", function() {
    loadManager.removeItem(strSearchResults);
    loadManager.removeItem(strExistIdLists);
    loadManager.removeItem(strKeyword);

    updateSearchResult(strSearchResults, 0, idSearchResult);
    updateSearchResult(strExistIdLists, 1, sentIdList);
    // updateSearchResult(strSenderEmail, 2);
  });

  $("#dbRest").on("click", async function() {
    if (senderId === undefined) {
      showToast("발송기를 선택해주세요", "warning");
      hideLoading();
      return;
    }
    const message =
      "정말 발송기의 보낸ID를 Reset 하시겠습니까?\nDB에서 해당 데이터가 삭제됩니다.";
    if (confirm(message)) {
      sendListClear();
    }
  });

  $("#testAll").on("click", function() {
    sendTestAll();
  });

  $("#testAllInput").on("keypress", function(e) {
    if (e.key == "Enter") {
      sendTestAll();
    }
  });

  $("#senderEmailModal").on("hidden.bs.modal", function() {
    $("#senderEmailModalBody").html("");
  });

  $("#senderModal").on("hidden.bs.modal", function() {
    $("#senderModal .modal-body").html(
      `<ul class="list-group" id="sender-group"></ul>`,
    );
    $("#search-modal-footer").addClass("visually-hidden");
    $("#search-sender").removeClass("visually-hidden");
  });

  $("#addNewMail").on("click", async () => {
    // if (senderId === undefined) {
    //   showToast("발송기를 선택해주세요", "warning");
    //   return;
    // }
    const newEmail = $("#addIdInput").val().trim().replaceAll(" ", "");
    const newPw = $("#addPwInput").val();

    const isAlreadyRegistered = senderEmailTotal.some(
      (mail) => newEmail === mail.id,
    );

    if (isAlreadyRegistered) {
      return showToast(`이미 등록된 계정(${newEmail})입니다.`, "warning");
    }

    if (newEmail == "" || newPw == "") {
      return showToast(
        "ID 혹은 password 칸이 비어있는지 확인하세요",
        "warning",
      );
    }

    const isValid = isValidEmail(newEmail);
    const newIdObj = [{ id: newEmail }];
    let isMailRegisteredObj = {};
    const [id, domain] = newEmail.split("@");

    const directRegisteredDomains = [
      "naver.com",
      "hanmail.net",
      "gmail.com",
      "kakao.com",
    ];
    const numRegex = /[0-9]+/;
    let mailRemains = null;

    if (directRegisteredDomains.includes(domain)) {
      isMailRegisteredObj.isSuccess = true;
    } else {
      try {
        showLoading();
        isMailRegisteredObj = await addNewHiworksMail(newEmail, newPw);
        console.log(
          "🔥 / file: index.js:564 / $ / isMailRegisteredObj:",
          isMailRegisteredObj,
        );

        const target = isMailRegisteredObj.message;
        const res = target.match(numRegex);
        mailRemains = target.replace(numRegex, Number(res[0]) - 1);

        hideLoading();
        // showToast(
        //   `신규 계정 등록에 성공했습니다. ${isMailRegisteredObj.message}`,
        //   "success"
        // );
      } catch (error) {
        hideLoading();
        return showToast(`신규 계정 등록에 실패했습니다.\n ${error}`, "danger");
      }
    }

    if (isValid && isMailRegisteredObj.isSuccess) {
      const { isSuccess, insertId } = await addSenderMailAccount(
        newEmail,
        newPw,
        mailRemains,
      );
      try {
        senderEmailTotal = Array.from(
          new Set([...senderEmailTotal, ...newIdObj].map(JSON.stringify)),
        ).map(JSON.parse);
        $("#sender-list .badge").text(senderEmailTotal.length);
        const newEmailDom = createSenderEmailList(newEmail, insertId);
        $("#senderTotalList").prepend(newEmailDom);
        socket.emit("newSenderEmail", { newId: newEmail, insertId });
      } catch (error) {
        return console.error(error);
      }
    } else {
      return showToast("이메일 형식에 맞춰 입력해주세요.", "warning");
    }
  });

  $("#insertLink").on("click", async function() {
    const campaignNo = $("#campaignNo").val().trim();
    const displayText = $("#displayText").val().trim();
    if (campaignNo === "") {
      return showToast("캠페인 번호를 확인해주세요", "warning");
    }

    try {
      // const url = `<a target="_blank" href="https://reviewnavi.co.kr/campaign_detail.php?campaign_no=${campaignNo}">${displayText}</a>`;
      $.post("/db/storeHash", { cno: campaignNo }, function(response) {
        if (response.isSuccess) {
          const hash = response.hash;
          const url = `<a target="_blank" href="https://reviewnavi.co.kr/rhash.php?surl=${hash}">${displayText}</a>`;
          insertContentAtCursor(url);
        }
      });
    } catch (e) {
      showToast(`링크삽입 도중 오류 발생\n${e}`, "danger");
      return console.error(e);
    }
  });

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

  toolbarOptions = [
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

  quill = new Quill("#editor", {
    modules: {
      toolbar: toolbarOptions,
    },
    placeholder: "메일 내용을 작성해주세요",
    theme: "snow",
  });

  quill.getModule("toolbar").addHandler("image", imageHandler);

  quill.on("selection-change", (range, oldRange, source) => {
    if (range) {
      lastCursorPosition = range.index;
    }
  });

  $("#clearQuillText").on("click", function() {
    const message = "에디터 본문의 모든 내용이 삭제됩니다.\n제목은 유지됩니다.";
    if (confirm(message)) {
      quill.root.innerHTML = "";
      selectedTemplateName = null;
    }
  });

  $("#saveTemplate").on("click", async () => {
    /* if (senderId === undefined) {
      showToast("발송기를 선택해주세요", "warning");
      return;
    } */

    const subject = $("#subjectInput").val();

    if (subject === "") {
      showToast("메일 제목이 비어있습니다.", "warning");
      return;
    }

    const innerHTML = quill.root.innerHTML;

    if (innerHTML === "<div><br></div>") {
      showToast("에디터 본문 내용이 비어있습니다.", "warning");
      return;
    } else {
      const message = "현재 내용을 템플릿으로 저장";
      const templateName = prompt(
        message,
        selectedTemplateName ?? "템플릿 이름 입력",
      );
      if (templateName != "" && templateName != null) {
        const isExistName = await checkHtmlTemplate(templateName);
        showLoading();
        if (!isExistName) {
          setHtmlTemplate(templateName, innerHTML, subject);
        } else {
          hideLoading();
          const message = `동일한 이름의 템플릿 이름이 존재합니다: '${templateName}' 내용을 덮어쓰시겠습니까?`;
          if (confirm(message)) {
            showLoading();
            updateHtmlTemplate(templateName, innerHTML, senderId, subject);
          }
        }
      } else if (templateName == "") {
        showToast("템플릿 이름을 확인해주세요", "warning");
      }
    }
  });

  $("#controlTemplate")
  .off("click")
  .on("click", function() {
    getSenderTemplateAll();
  });

  $("#openInNewWindow").on("click", function(e) {
    e.preventDefault();
    const htmlContent = quill.root.innerHTML;

    // Create a new window
    const newWindow = window.open("", "_blank");

    // Write the HTML content to the new window
    newWindow.document.write(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="/vendors/quill/quill.min.js"></script>
        <link rel="stylesheet" href="/vendors/quill/quill.snow.css">
        <title>템플릿 내용 확인</title>
      </head>
      <body>`,
    );
    newWindow.document.write(htmlContent);
    newWindow.document.write("</body></html>");

    // Close the document of the new window
    newWindow.document.close();
  });

  $("#toggleModal").on("click", ".choose-template", function(e) {
    selectedTemplateName = $("#toggleModal-title")
    .text()
    .split(TEXT_DIVIDER)[0]
    .trim();
    const no = $("#template-id").val();

    templateList.map((template) => {
      if (no == template.template_no) {
        quill.root.innerHTML = selectedTemplateContents;
        $("#subjectInput").val(template.template_subject);
        $("#toggleModal").modal("hide");
      }
    });
  });

  $("#sendMailResv").on("click", function() {
    timeZ = getAllowedTimeZone();

    transInfo = preparingSendMail(YES);

    if (!transInfo.innerHTML.match(linkRegex)) {
      showToast("본문에 캠페인 링크가 없습니다", "danger");
      return;
    }

    if (!isReadyToSendMail.isReady) {
      checkInfoForSendMail(isReadyToSendMail.emptyResource);
      return;
    } else {
      const content = `
        <label for="sendStartTimeInput">Send Start Time:</label>
        <p class="text-red">발송 가능한 시간: ${timeZ.startTime} ~ ${
        timeZ.endTime
      }</p>
        <input type="datetime-local" id="sendStartTimeInput" value="${getCurrentDateTimeForInput()}" class="form-control" min="${getCurrentDateTimeForInput()}" >
        <button class="btn btn-primary mt-3" id="reservationButton">예약발송</button>`;

      $("#modalContent").html(content);
      $("#detailsModalLabel").text("예약 발송 시간 설정");
      $("#detailsModal").modal("show");
    }
  });

  $("#sendMailImmd").on("click", function() {
    transInfo = preparingSendMail(NO);

    if (!transInfo.innerHTML.match(linkRegex)) {
      showToast("본문에 캠페인 링크가 없습니다", "danger");
      return;
    }

    if (!isReadyToSendMail.isReady) {
      checkInfoForSendMail(isReadyToSendMail.emptyResource);
      return;
    } else {
      setTimeout(() => {
        showLoading();
      }, 0);
      transInfo.dispatch_registration_time = getDate();
      transInfoBackup.dispatch_registration_time =
        transInfo.dispatch_registration_time;
      dbMailSendingReg(transInfo);
      transInfo = "";
      isReadyToSendMail = {};
    }
  });

  $("#sendMailTest").on("click", function() {
    transInfo = preparingSendMail(NO);
    if (!isReadyToSendMail.isReady) {
      checkInfoForSendMail(isReadyToSendMail.emptyResource);
      return;
    } else {
      transInfo.dispatch_registration_time = getDate();
      transInfo.dispatch_registration_time =
        transInfo.dispatch_registration_time;
      // instead DB registration
      console.log("transInfo: ", transInfo);

      transInfo = "";

      console.log("transInfo reset: ", transInfo);
    }
  });

  $("#modalContent").on("click", "#reservationButton", function() {
    // const selectedTime = new Date($("#sendStartTimeInput").val());
    // if (!isTimeWithinAllowedRange(selectedTime, timeZ)) {
    //   alert("발송 가능한 시간 범위 내에서 선택해야 합니다.");
    //   return;
    // } else {
    // }
    transInfo.dispatch_registration_time = $("#sendStartTimeInput").val();
    transInfo.dispatch_registration_time = transInfo.dispatch_registration_time;

    $("#detailsModal").modal("hide");
    setTimeout(() => {
      showLoading();
    }, 0);
    dbMailSendingReg(transInfo);
    transInfo = "";
    isReadyToSendMail = {};
  });

  $("#keywordPreset")
  .off("click")
  .on("click", function() {
    if (senderId === undefined) {
      showToast("발송기를 선택해주세요", "warning");
      hideLoading();
      return;
    } else {
      updateKeywordList(senderId);
    }
  });

  $("#senderModal").on("click", "#insertKeyword", function() {
    // Add selected keywords to #searchingForId separated by commas
    if (selectedKeywords.length == 0) {
      showToast("선택된 키워드가 없습니다.", "warning");
      return;
    }
    const selectedKeywordsStr = selectedKeywords.join(", ");
    $("#searchingForId").val(selectedKeywordsStr);
    $("#senderModal").modal("hide");
  });

  $("#senderModal").on("click", "#selectAndSearch", function(e) {
    if (selectedKeywords.length == 0) {
      showToast("선택된 키워드가 없습니다.", "warning");
      return;
    } else {
      const selectedKeywordsStr = selectedKeywords.join(", ");
      $("#searchingForId").val(selectedKeywordsStr);
      $("#senderModal").modal("hide");
      setTimeout(() => {
        doSearch();
      }, 500);
    }
  });

  $("#senderModal").on("keypress", "#addKeywordInput", function(e) {
    if (e.key == "Enter") {
      const newKeyword = $(this).val().trim();
      if (newKeyword === "") {
        showToast("추가할 키워드를 입력해주세요.", "warning");
        return;
      } else {
        insertKeyWord(newKeyword, senderId);
      }
    }
  });

  $("#senderModal").on("click", "#addKeyword", function() {
    const newKeyword = $(this).siblings("input").val().trim();
    if (newKeyword === "") {
      showToast("추가할 키워드를 입력해주세요.", "warning");
      return;
    } else {
      insertKeyWord(newKeyword, senderId);
    }
  });

  $("#senderModal").on("click", "#deleteKeyWord", function() {
    const deleteKeyword = $(this).prev().find("label").text().trim();
    if (confirm(`정말 키워드 '${deleteKeyword}' 를 삭제 하시겠습니까?`)) {
      const no = $(this).data("no");
      deleteKeyWord(no);
      selectedKeywords = selectedKeywords.filter((keyword) => {
        return keyword != deleteKeyword;
      });
    }
  });

  $("#keywordReset").on("click", function() {
    $("#searchingForId").val("").focus();
  });

  $("#senderTotalList").on("contextmenu", "li", function(e) {
    e.preventDefault();
    [email, domain] = $(this).find("label").text().split("@");

    if (domain.startsWith("reviewnavi")) {
      $("#changeAccount").text(`발송 계정 변경 (${email})`).show();
      $("#deleteAccount").text(`발송 계정 삭제 (${email})`).show();
    } else {
      $("#changeAccount").hide();
      $("#deleteAccount").text(`발송 계정 삭제 (${email})`).show();
    }

    $(".context-menu").css({
      display: "block",
      left: e.pageX,
      top: e.pageY,
    });
  });

  // 전체발송계정 탭에서만 표시되는 컨텍스트 메뉴 제어
  $(document).on("click", function() {
    $(".context-menu").hide();
  });

  $("#deleteAccount").on("click", async function() {
    const willRemoveEmail = email + "@" + domain;
    if (domain.includes("reviewnavi")) {
      await deleteEmailFromHiworks(willRemoveEmail);
    }
    deleteSenderFromDB(willRemoveEmail);
  });

  $("#changeAccount").on("click", function() {
    $("#senderModalLabel").text("발송계정ID 수정");
    $("#search-sender").addClass("visually-hidden");
    $(".modal-body").html(`
      <ul class="list-group list-group-flush align-self-center">
        <li class="list-group-item w-100 text-break">
          ID를 변경하시면, 이전 메일주소로는 더 이상 수신할 수 없습니다. (이미 수취한 메일은 확인 가능)
        </li>
        <li class="list-group-item w-100 text-break">
          사용자 환경의 ‘회신메일주소’는 새로운 메일주소로 자동 변경됩니다.
        </li>
        <li class="list-group-item w-100 text-break">
          ID는 특수문자로 시작할 수 없으며, 2~20자리의 영문 소문자, 숫자,
      '-', '_', '.'만 가능합니다.
        </li>
        <li class="list-group-item w-100 text-break fw-bolder">
          현재 ID: ${email}
        </li>
      </ul>
      <div class="input-group mb-3 h-25">
        <input type="text" class="form-control" placeholder="변경할 ID 입력" id="new-sender-id" value=${email} required>
        <span class="input-group-text w-auto">@${domain}</span>
        <div class="invalid-feedback"></div>
      </div>
    `);

    $("#search-modal-footer").removeClass("visually-hidden");

    $("#senderModal").on("shown.bs.modal", function() {
      $("#new-sender-id").trigger("focus");

      const currentValue = $("#new-sender-id").val();

      $("#new-sender-id").val("").val(currentValue);
      // $("#new-sender-id").val(currentValue);
    });
    $("#senderModal").modal("show");
  });

  $("#senderModal").on("shown.bs.modal", function() {
    $("#search-sender").trigger("focus");
  });

  // start agent, store filter area
  getAgentList();
  getStoreList();

  $(".dropdown-agent").on("hidden.bs.dropdown", function() {
    $("#agent-search").val("");
    $("#agent-dropdown-menu li").each(function() {
      $(this).show();
    });
  });

  $(".dropdown-store").on("hidden.bs.dropdown", function() {
    $("#store-search").val("");
    $("#store-dropdown-menu li").each(function() {
      $(this).show();
    });
  });

  $(".dropdown-agent").on("shown.bs.dropdown", function() {
    $("#agent-search").trigger("focus");
  });

  $(".dropdown-store").on("shown.bs.dropdown", function() {
    $("#store-search").trigger("focus");
  });

  // end agent, store filter area

  setTimeTodayInFilter();

  $("#filter-period a").on("click", function() {
    const today = new Date();
    const months = parseInt($(this).data("month"));
    filterPeriod = isNaN(months) ? null : months;

    if (isNaN(months)) {
      return $("#filter-date").val("");
    }
    const newDate = new Date(
      today.getFullYear(),
      today.getMonth() + months,
      today.getDate() + 1,
    );

    const formattedNewDate = newDate.toISOString().split("T")[0];
    $("#filter-date").val(formattedNewDate);
  });

  $("#save-filter").on("click", function() {
    const integrate = [];

    $("#tag-area span").each(function() {
      if ($(this).data("agent")) {
        const agentNo = $(this).data("agent");
        const agentName = $(this).attr("id");
        integrate.push({ type: "agent", no: agentNo, name: agentName });
      } else {
        const storeNo = $(this).data("store");
        const storeName = $(this).attr("id");
        integrate.push({ type: "store", no: storeNo, name: storeName });
      }
    });

    if (integrate.length === 0) {
      return showToast("저장할 필터가 없습니다", "warning");
    }

    // show prompt for filter name
    const filterName = prompt("저장할 필터 이름을 입력하세요");
    if (filterName === null || filterName === "") {
      return showToast("필터 이름을 입력하세요", "warning");
    } else {
      integrate.push({ type: "period", date: filterPeriod });
      setFilterTemplate(filterName, integrate);
    }
  });

  $("#reset-filter").on("click", function() {
    setTimeTodayInFilter();
    $("#tag-area").html("");

    const clearedStatus = loadManager.getItem(strSearchResults).map((item) => {
      if (item.status) {
        delete item.status;
      }
      return item;
    });

    loadManager.setItem(strSearchResults, clearedStatus);
    updateSearchResult(strSearchResults, 0, idSearchResult);
  });

  $("#apply-filter").on("click", function() {
    const date = $("#filter-date").val();
    let agentNoArr = [];
    let storeNoArr = [];

    $("#tag-area span").each(function() {
      if ($(this).data("agent")) {
        agentNoArr.push($(this).data("agent"));
      } else {
        storeNoArr.push($(this).data("store"));
      }
    });
    if (agentNoArr.length == 0 && storeNoArr.length == 0) {
      return showToast("필터 적용할 대상이 없습니다", "warning");
    }

    usersWhoHaveAlreadyJoined(date, agentNoArr, storeNoArr);
  });

  $("#sort-emails").on("click", function() {
    const sortedObj = loadManager.getItem(strSearchResults).sort((a, b) => {
      return b.score - a.score;
    });
    $("#searchResult").html("");
    fillDOM(sortedObj, 0, idSearchResult);
  });

  $("#unsort-emails").on("click", function() {
    updateSearchResult(strSearchResults, 0, idSearchResult);
  });

  $("#filter-template")
  .off("click")
  .on("click", function() {
    getFilterTemplateAll();
  });

  $("#super-account").on("click", function() {
    loadSuperAccounts();
  });

  $("#addSuperAccount").click(addSuperAccount);
  $("#newSuperAccount").keypress(function(e) {
    if (e.which == 13) {
      addSuperAccount();
    }
  });

  $("#superAccountModal").on(
    "click",
    ".delete-super-account",
    deleteSuperAccount,
  );
  $("#superAccountModal").on("change", ".toggle-emergency", toggleEmergency);
});

$(document).on("keydown", "#searchResult", function(e) {
  if (e.key == "Delete") {
    const collectedId = loadManager.getItem(strSearchResults);
    const selectedOptions = $(this).children("option:selected");

    const updatedCollectedId = collectedId.filter((obj) => {
      let shouldKeep = true;
      for (const selected of selectedOptions) {
        const option = selected.value.replaceAll(" ", "").split("/")[0];
        if (obj.id === option) {
          shouldKeep = false;
          break;
        }
      }
      return shouldKeep;
    });

    loadManager.setItem(strSearchResults, updatedCollectedId);

    selectedOptions.remove();
    $("#collectedId .badge").text(updatedCollectedId.length);
    // updateSearchResult(strSearchResults, 0, idSearchResult);
    // $("#searchResult").html("");
    // fillDOM(updatedCollectedId, 0, idSearchResult);
  } else if (e.key == "Tab") {
    e.preventDefault();
    const collectedId = loadManager.getItem(strSearchResults);
    const selectedOptions = $(this).children("option:selected");
    const option = selectedOptions.val().replace(" ", "").split("/")[0];
    const message = `수집ID '${option}' 를 블랙리스트에 추가하시겠습니까?`;
    if (confirm(message)) {
      const time = getDate();
      addBlackListFromDB(option, time);
      const updatedCollectedId = collectedId.filter((obj) => {
        return obj.id !== option ? true : false;
      });
      loadManager.setItem(strSearchResults, updatedCollectedId);
      selectedOptions.remove();
      $("#collectedId .badge").text(updatedCollectedId.length);
      // updateSearchResult(strSearchResults, 0, idSearchResult);
      // $("#searchResult").html("");
      // fillDOM(updatedCollectedId, 0, idSearchResult);
    }
  }
});

$("#delete-filtered").on("click", function() {
  removeJoinedUser();
});

$("#agent-search").on("keyup change clear", function() {
  delay(300);
  const searchValue = $(this).val().toLowerCase();
  $("#agent-dropdown-menu li").filter(function() {
    $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
  });
});

$("#store-search").on("keyup change clear", function() {
  delay(300);
  const searchValue = $(this).val().toLowerCase();
  $("#store-dropdown-menu li").filter(function() {
    $(this).toggle($(this).text().toLowerCase().indexOf(searchValue) > -1);
  });
});

$(document).on("click", "#agent-dropdown-menu li", function() {
  const name = $(this).data("name");
  const no = $(this).data("no");
  const badge = `<span class="badge text-bg-agent text-dark m-1 align-align-self-center" id=${name} data-agent=${no}>${name} 
    <button class="btn-close fw-bold" id="remove-badge">X</button>
    </span>`;
  $("#tag-area").append(badge);
});

$(document).on("click", "#store-dropdown-menu li", function() {
  const name = $(this).data("name");
  const no = $(this).data("no");
  const badge = `<span class="badge text-bg-store text-dark m-1 align-align-self-center" id=${name} data-store=${no}>${name}<button class="btn-close fw-bold" id="remove-badge">X</button>
  </span>`;
  $("#tag-area").append(badge);
});

$(document).on("click", "#tag-area span .btn-close", function() {
  $(this).parent().remove();
});

$("#unassign-all-emails").on("click", function() {
  const message = "모든 발송 계정을 해제하시겠습니까?";
  if (confirm(message)) {
    unassignAllEmails();
  }
});

$(document).on("keyup", "#new-sender-id", function() {
  const newId = $(this).val();
  if (newId !== "" && isValidID(newId)) {
    $(this).removeClass("is-invalid");
    $(".invalid-feedback").text("");
  } else {
    $(this).addClass("is-invalid");
    $(".invalid-feedback").text(
      "입력한 ID가 유효하지 않습니다. 올바른 형식으로 입력해 주세요.",
    );
  }

  if (email.split("@")[0] === newId) {
    $(this).addClass("is-invalid");
    $(".invalid-feedback").text("동일한 아이디 입니다.");
  }
});

$(document).on("keypress", "#new-sender-id", function(e) {
  if (e.key === "Enter") {
    const newId = $("#new-sender-id").val();
    if (newId !== "" && isValidID(newId) && email !== newId) {
      changeSenderEmail(email, newId, domain);
    }
  }
});

$("#change-sender-id").on("click", function() {
  const newId = $("#new-sender-id").val();
  if (newId !== "" && isValidID(newId) && email !== newId) {
    changeSenderEmail(email, newId, domain);
  }
});

$("#senderModal").on("click", "#checkAll", function(e) {
  let $checkboxes = $(".modal-body input[type=checkbox]");
  const labelContents = $checkboxes.next("label");
  let isCheckedAll =
    $checkboxes.length === $checkboxes.filter(":checked").length;

  $checkboxes.prop("checked", !isCheckedAll);
  $(this)
  .toggleClass("checkall uncheckall")
  .text(isCheckedAll ? "모두 체크" : "모두 체크 해제");

  // if ($(this).find(":checkbox").is(":checked")) {
  if ($checkboxes.is(":checked")) {
    e.stopPropagation();

    for (let index = 0; index < labelContents.length; index++) {
      const element = labelContents[index].innerHTML;
      selectedKeywords.push(element);
    }
  } else {
    e.stopPropagation();
    selectedKeywords = selectedKeywords.filter((item, index) => {
      item !== labelContents[index].innerHTML;
    });
  }
});

$("#senderModal").on("click", "#resetAll", function() {
  if (selectedKeywords.length == 0) {
    showToast("선택된 키워드가 없습니다.", "warning");
    return;
  }
  const checkedTexts = $(".modal-body input[type=checkbox]:checked")
  .map(function() {
    return $(this).next("label").text();
  })
  .get();
  let checkedValues = [];
  $(".form-check-input.me-1:checked").each(function() {
    checkedValues.push($(this).data("no"));
  });

  deleteKeyWordList(checkedValues);

  selectedKeywords = selectedKeywords.filter((keyword) => {
    return !checkedTexts.includes(keyword);
  });
});

$("#logout").on("click", function() {
  $.post("/logout").then((res) => {
    window.location.href = "/login";
  });
});

$("#template-search").on("keyup change clear", function() {
  const searchValue = $(this).val().toLowerCase();

  // $("#template-list li").each(function () {
  $("#template-list .list-group-item").each(function() {
    const templateName = $(this).find(".template-name").text().toLowerCase();
    const $checkbox = $(this).siblings(".form-check-input");

    if (templateName.indexOf(searchValue) !== -1) {
      $(this).show();
      $checkbox.show();
    } else {
      $(this).hide();
      $checkbox.hide();
      // if checkbox is checked, uncheck it
      if ($checkbox.is(":checked")) {
        $checkbox.prop("checked", false);
      }
    }
  });
});

$(document).on("click", ".select-template", function() {
  const no = $(this).data("no");

  getSpecificTemplate(no);
});

$(document).on("click", ".select-filter", function() {
  const no = $(this).data("no");
  createFilterBadge(filterTemplateList, no);
  $("#filterTemplateModal").modal("hide");
  showToast("필터가 적용되었습니다", "success");
});

$("#delete-filter").on("click", function() {
  const checkedNoArr = [];
  $("#filter-list input[type=checkbox]:checked").each(function(
    index,
    element,
  ) {
    checkedNoArr.push($(element).data("no"));
  });

  deleteSpecificFilterList(checkedNoArr);
});

$("#del-checked-template").on("click", function() {
  const checkedNoArr = [];
  $("#template-list input[type=checkbox]:checked").each(function(
    index,
    element,
  ) {
    checkedNoArr.push($(element).data("template-id"));
  });

  deleteHtmlTemplateList(checkedNoArr);
});

$("#edit-template").on("click", function() {
  const [templateName, mailTitle] = $("#toggleModal-title")
  .text()
  .trim()
  .split(TEXT_DIVIDER);

  selectedTemplateName = templateName;

  // clear inner text of #$("#toggleModal-title")
  $("#toggleModal-title").text("");
  // add input element to #$("#toggleModal-title")
  $("#toggleModal-title").append(
    `<input type="text" id="edit-template-name" value="${templateName?.trim()}" class="form-control" placeholder="템플릿 이름 입력"/>
    <textarea type="text" id="edit-template-title" class="form-control" placeholder="메일 제목 입력" rows="2">${mailTitle?.trim()}</textarea>
    `,
  );

  $("#toggleModal .modal-body").html("");
  $("#toggleModal .modal-body").append(`<div id="editor2"></div>`);

  quill2 = new Quill("#editor2", {
    modules: {
      toolbar: toolbarOptions,
    },
    placeholder: "메일 내용을 작성해주세요",
    theme: "snow",
  });

  quill2.getModule("toolbar").addHandler("image", imageHandler);

  quill2.root.innerHTML = selectedTemplateContents;

  $("#save-template").removeClass("visually-hidden");
  $(".choose-template").addClass("visually-hidden");
  $("#edit-template").addClass("visually-hidden");
});

// #htmlTemplateModal is hidden, init #template-search input
$("#htmlTemplateModal").on("hidden.bs.modal", function() {
  $("#template-search").val("");
  $("#template-list .list-group-item").each(function() {
    const $checkbox = $(this).siblings(".form-check-input");
    $(this).show();
    $checkbox.show();
  });
});

$("#toggleModal").on("hidden.bs.modal", function() {
  $("#save-template").addClass("visually-hidden");
  $(".choose-template").removeClass("visually-hidden");
  $("#edit-template").removeClass("visually-hidden");
});

$("#save-template").on("click", function() {
  const no = $("#template-id").val();
  const templateName = $("#edit-template-name").val();
  const mailTitle = $("#edit-template-title").val();

  const innerHTML = quill2.root.innerHTML;

  // inspect innerHTML is blank or not
  if (innerHTML === "<div><br></div>") {
    alert("본문이 비어있습니다.");
    return;
  }

  selectedTemplateContents = innerHTML;

  updateHtmlTemplateContents(no, templateName, mailTitle, innerHTML);
});

$("#back-to-template-list").on("click", function(e) {
  e.preventDefault();
  $("#toggleModal").modal("hide");
  createTemplate(templateList);
  $("#htmlTemplateModal").modal("show");
});

$(document).on("click", ".sender-switch", function() {
  const isChecked = $(this).is(":checked");
  const email = $(this).data("email");
  const mail_no = $(this).attr("id").split("-")[1].trim();
  if (isChecked) {
    const isUsing = isEmailUsing(email) ?? {};
    if (Object.keys(isUsing).length > 0) {
      const message = `이미 발송기 "${isUsing.agent_no}. ${isUsing.name}" 에서 사용중인 계정입니다. 그래도 할당 하시겠습니까?`;
      if (confirm(message)) {
        return insertSenderEmailAgent(
          email,
          mail_no,
          // senderEmailInfo[0]?.agent_no
          senderId,
        );
      } else {
        return $(this).prop("checked", false);
      }
    }
    insertSenderEmailAgent(email, mail_no, senderId);
  } else {
    disableSenderEmailAgent(email, mail_no, senderId);
  }
  updateSearchResult(strSenderEmail, 2, senderIdList);
});

$(document).on("keyup change clear", "#search-sender", function() {
  const searchValue = $(this).val().toLowerCase();

  $("#sender-group .list-group-item").each(function() {
    const senderName = $(this).find(".form-check-label").text().trim();
    const $checkbox = $(this)
    .find(".form-check-label")
    .siblings(".form-check-input");
    const button = $(this).next("button");

    if (senderName.indexOf(searchValue) !== -1) {
      $(this).show();
      $checkbox.show();
      button.show();
    } else {
      $(this).hide();
      $checkbox.hide();
      button.hide();
    }
  });
});

$(document).on("keyup change clear", "#search-filter", function() {
  const searchValue = $(this).val().toLowerCase();

  $("#filter-list .list-group-item").each(function() {
    const senderName = $(this).find(".form-check-label").text().trim();
    const $checkbox = $(this)
    .find(".form-check-label")
    .siblings(".form-check-input");
    const button = $(this).next("button");

    if (senderName.indexOf(searchValue) !== -1) {
      $(this).show();
      $checkbox.show();
      button.show();
    } else {
      $(this).hide();
      $checkbox.hide();
      button.hide();
    }
  });
});

$("#filterTemplateModal").on("shown.bs.modal", function() {
  $("#search-filter").trigger("focus");
});

$("#superAccountModal").on("hidden.bs.modal", function() {
  $("#superAccountList").empty();
});
