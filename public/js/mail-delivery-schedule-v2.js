$(document).ready(function () {
  console.log("schedule-v2");

  const params = new URLSearchParams(window.location.search);
  const groupNum = params.get("groupNum");
  const groupName = params.get("groupName");

  $(".headers").prepend(`
      <h5 style="align-self: center;"><i class="bi bi-people-fill">  ${groupName}</i></h5>
    `);

  getMailStateDetail(groupNum);

  let table = $("#delivery-table").DataTable({
    initComplete: function () {
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
    },

    drawCallback: function () {
      // Reset tooltips every time the table is redrawn
      let tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    },
    autoWidth: true,
    paging: true,
    responsive: {
      details: {
        type: "inline",
        // target: "tr",
      },
    },
    dom: `
            <'row'
              <'d-flex justify-content-between' lf>
            >
          
            <'row'
              t
            >
          
            <'row'
              <'d-flex justify-content-between' ip>
            >`,

    columns: [
      {
        title: "수집ID",
        data: "collection_id",
      },
      {
        title: "발송 등록",
        data: null,
        render: (data, type, row) => {
          return formatDate(row.dispatch_registration_time);
        },
      },
      {
        title: "발송 시작",
        data: null,
        render: (data, type, row) => {
          return row.send_start_time === null
            ? "발송 대기중"
            : formatDate(row.send_start_time);
        },
      },
      {
        title: "발송 완료",
        data: null,
        render: (data, type, row) => {
          return row.dispatch_finish_time === null
            ? "미정"
            : formatDate(row.dispatch_finish_time);
        },
      },
      {
        title: "발송 예약",
        data: "reservation_sent",
        width: "10%",
      },
      {
        width: "10%",
        title: "발송 상태",
        // data: "send_status",
        // 'immediately','scheduled','sending','finished','failed'
        render: (data, type, row) => {
          switch (row.send_status) {
            case "immediately":
              return '<h5><span class="badge text-bg-secondary">즉시 발송</span></h5>';
            case "scheduled":
              return '<h5><span class="badge text-bg-primary">예약</span></h5>';
            case "sending":
              return '<h5><span class="badge text-bg-warning">발송중</span></h5>';
            case "finished":
              return '<h5><span class="badge text-bg-success">발송 완료</span></h5>';
            case "failed":
              return `<h5>
              <span span class="badge text-bg-danger"
              data-bs-toggle="tooltip" data-bs-custom-class="custom-tooltip"
              data-bs-placement="top"
              data-bs-delay='{"show":"0", "hide":"1000"}'
              title="${row.error_message}">
              발송 실패
              </span ></h5 >`;
            case "rejected":
              return '<h5><span class="badge text-bg-dark">발송 차단</span></h5>';

            default:
              return '<h5><span class="badge text-bg-info">init</span></h5>';
          }
        },
      },
      {
        title: "읽음",
        data: "mail_read_status",
        width: "10%",
      },
    ],
    columnDefs: [
      // { className: "none", targets: 0 },
      // { responsivePriority: 4, targets: 1 },
      // { responsivePriority: 6, targets: 2 },
      // { responsivePriority: 5, targets: 3 },
      // { responsivePriority: 7, targets: 4 },
      // { responsivePriority: 2, targets: 5 },
      // { responsivePriority: 3, targets: 6 },
    ],
    createdRow: (row, data, dataIndex) => {
      $(row)
        .find("td")
        .css({ "vertical-align": "middle", "text-align": "center" });
    },
    order: [],
  });

  // Function to update input widths
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
