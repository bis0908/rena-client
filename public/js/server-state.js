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

function generateServerStatusList(serverStats) {
  let list = "";
  serverStats.forEach((serverInfo) => {
    list += makeList(serverInfo);
  });
  return `<table class="table table-striped align-middle" >
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Last Update</th>
        <th>Mac Address</th>
      </tr>
    </thead>
    <tbody>
      ${list}
    </tbody>
  </table>`;
}

$(document).on("click", "#changeServerName", function () {
  const btnElement = $(this);
  const tdElement = btnElement.closest("td");
  const no = btnElement.data("no");

  // div 요소에서 최신 서버 이름을 가져오기 위해 업데이트된 data-name 값을 가져옴
  const name = btnElement.data("name");

  const newServerName = prompt("새로운 서버 이름 입력", name);
  if (!newServerName) {
    return;
  }

  if (newServerName === "" || newServerName.length === 1) {
    return alert("서버 이름이 올바르지 않습니다.");
  }

  $.post(
    "/db/changeServerName",
    { no, newServerName },
    function (data, textStatus, jqXHR) {
      if (data.isSuccess) {
        // div 요소의 텍스트를 변경
        tdElement.find(".server-name").text(newServerName);
        // 버튼의 data-name 속성 업데이트
        btnElement.attr("data-name", newServerName);
        btnElement.data("name", newServerName);
        // 삭제 버튼의 data-name도 업데이트
        tdElement.find("#removeServer").attr("data-name", newServerName);
      } else {
        console.error(jqXHR);
        console.error(textStatus);
      }
    },
    "json"
  );
});

$(document).on("click", "#removeServer", function () {
  const btnElement = $(this);
  const no = btnElement.data("no");
  const name = btnElement.data("name");
  const message = `"${name}" 서버가 목록에서 제거됩니다.`;

  if (confirm(message)) {
    $.post(
      "/db/deleteServer",
      { no },
      function (data, textStatus, jqXHR) {
        if (data.isSuccess) {
          btnElement.closest("tr").remove();
        }
      },
      "json"
    );
  }
});

function timeDifference(current, previous) {
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  const elapsed = current - previous;

  if (elapsed < msPerMinute) {
    return Math.round(elapsed / 1000) + "초 전";
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + "분 전";
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + "시간 전";
  } else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + "일 전";
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + "개월 전";
  } else {
    return Math.round(elapsed / msPerYear) + "년 전";
  }
}

function dateCompare(server_last_update) {
  const serverLastUpdateDate = new Date(server_last_update);
  const currentDate = new Date();

  return timeDifference(currentDate, serverLastUpdateDate);
}

function makeList(serverInfo) {
  const { no, server_name, server_status, server_last_update, mac_address } =
    serverInfo;
  let statusTag = "";

  const timeDiff = calculateTimeDifference(server_last_update);

  switch (server_status) {
    case "0":
      statusTag =
        '<i class="bi bi-database-slash text-danger" style="font-size: 36px;"></i>';
      break;
    case "1":
      if (timeDiff > 60) {
        statusTag =
          '<i class="bi bi-database-exclamation text-danger" style="font-size: 36px"></i>';
      } else if (timeDiff > 5) {
        statusTag =
          '<i class="bi bi-database-slash text-warning" style="font-size: 36px;"></i>';
      } else {
        statusTag =
          '<i class="bi bi-database-check text-success" style="font-size: 36px"></i>';
      }
      break;
    case "2":
      statusTag =
        '<i class="bi bi-database-exclamation text-warning" style="font-size: 36px"></i>';
      break;
    default:
      statusTag = '<i class="bi bi-database-lock" style="font-size: 36px"></i>';
      break;
  }

  // MAC 주소의 마지막 세 그룹을 별표 처리
  const maskedMac = mac_address.replace(
    /([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2}):([0-9A-Fa-f]{2})$/,
    "**:**:**"
  );

  return `
  <tr>
    <td>
      <div class="d-flex justify-content-between">
        <div class="server-name">
          ${server_name}
        </div>
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-outline-primary" id="changeServerName" data-no=${no} data-name=${server_name}>이름 변경</button>
          <button type="button" class="btn btn-danger" id="removeServer"
          data-no=${no} data-name=${server_name}>삭제</button>
        </div>
      </div>
    </td>
    <td>${statusTag}</td>
    <td>${dateCompare(server_last_update)}</td>
    <td>${maskedMac}</td>
  </tr>`;
}

function calculateTimeDifference(serverLastUpdate) {
  const now = new Date();
  const serverUpdateTime = new Date(serverLastUpdate);
  const diffInMilliseconds = now.getTime() - serverUpdateTime.getTime();
  const diffInMinutes = diffInMilliseconds / (1000 * 60);

  return diffInMinutes;
}
