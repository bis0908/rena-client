import { executeQuery, pool } from "../config/dbConfig.js";

import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import axios from "axios";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { getDate } from "./common.js";
import { load } from "cheerio";
import logger from "../config/logger.js";

dotenv.config({ path: "config.env" });

const createPurifyInstance = () => {
  const window = new JSDOM("").window;
  return DOMPurify(window);
};

/**
 * Special character parsing
 * @param {string} dom
 * @returns String
 */
function regexHtml(dom) {
  try {
    dom = String(dom);
    dom = dom.replace(/=""/g, "");
    dom = dom.replace(/\"/g, "");
    dom = dom.replace(/\\/g, '"');

    return dom;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

const HTML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&#39;": "'",
};

function unEscapeHtml(str) {
  if (!str) {
    logger.error("str is null or undefined");
    return "";
  }

  return str
    .toString()
    .replace(/&(?:amp|lt|gt|quot|#0?39);/g, (match) => HTML_ENTITIES[match]);
}

async function getHTML(url) {
  try {
    const { data } = await axios.get(url).catch((error) => {
      if (error.response) {
        logger.error("Response Status: " + error.response.status);
        logger.error("Response Headers: " + error.response.headers);
        logger.error("Config: " + JSON.stringify(error.config));
      } else if (error.request) {
        logger.error(
          "No response was received: " + JSON.stringify(error.request)
        );
      } else {
        logger.error("Error message: " + error.message);
      }
    });
    return load(data);
  } catch (error) {
    logger.error(error.stack);
    logger.error(url);

    throw error;
  }
}

export async function getSender() {
  const query = "select * from mail_agent;";

  try {
    const [rows, fields] = await pool.query(query);
    return rows;
  } catch (error) {
    logger.error("getSender(): querying database: " + error);
    throw error;
  }
}

export async function getOneSender(senderId) {
  const query = "select name from mail_agent where no = ?;";

  try {
    const [rows, fields] = await pool.query(query, [senderId]);
    return rows;
  } catch (error) {
    logger.error("getSender(): querying database: " + error);
    throw error;
  }
}

/**
 * @description Check the DB for sending history.
 * @param {Array<String>} idList
 * @param {string} agent_no
 * @returns id of array
 */
export async function realTimeIdCheck(idList, agent_no) {
  const rows = await getSuperIds();
  const filteredArr = rows.map((ids) => ids.super_id);

  if (filteredArr.includes(idList[0])) {
    return [];
  }

  const placeholders = idList.map(() => "?").join(",");
  const query = `
    SELECT distinct id
    FROM mail_sendlist
    WHERE agent_no = ?
    AND id IN (${placeholders});`;

  const values = [agent_no, ...idList];

  try {
    const rows = await executeQuery(query, values);
    return rows.length > 0 ? rows : [];
  } catch (error) {
    logger.error("realTimeIdCheck(): " + error);
    throw error;
  }
}

/**
 * @description Check the DB for Unsubscribe history.
 * @param {Array<String>} idList
 * @returns {Array<String>}
 */
export async function checkUnsubscribe(idList) {
  const placeholders = idList.map(() => "?").join(",");
  const values = idList.map((id) => `${id}@naver.com`);
  const query = `
    SELECT DISTINCT SUBSTRING_INDEX(email, '@', 1) as id
    FROM mail_unsubscribe
    WHERE email IN (${placeholders})`;

  try {
    return await executeQuery(query, values);
  } catch (error) {
    logger.error("checkUnsubscribe(): Error querying database:" + error);
    throw error;
  }
}

export async function updateMailAgent(senderName, senderNo) {
  const query = `UPDATE mail_agent SET name=?
  WHERE no=?;`;
  try {
    const result = await pool.query(query, [senderName, senderNo]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("updateMailAgent(): Error querying database:" + error);
    throw error;
  }
}

export async function getSenderEmail(senderNo) {
  const query = `SELECT DISTINCT mgs.id
    FROM mail_google_sender mgs
    JOIN mail_allocation_registry mar ON mgs.no = mar.mail_no
    JOIN mail_agent ma ON mar.agent_no = ma.no
    WHERE ma.no = ?
    ORDER BY mgs.no DESC;`;

  try {
    const [rows, fields] = await pool.query(query, [senderNo]);
    return rows;
  } catch (error) {
    logger.error("getSensitiveInfoList(): Error querying database:" + error);
    throw error;
  }
}

export async function addSenderMail(id, pw) {
  const query = `insert into mail_google_sender (id, password) values (?,?);`;
  try {
    const result = await pool.query(query, [id, pw]);
    return {
      isSuccess: result[0].affectedRows > 0,
      insertId: result[0].insertId,
    };
  } catch (error) {
    logger.error("insertGmail(): Error querying database:" + error);
    throw error;
  }
}

export async function addBlackList(id, date) {
  const email = id + "@naver.com";
  const query = `INSERT IGNORE INTO mail_unsubscribe (email, reg_date) values (?,?);`;
  try {
    const result = await pool.query(query, [email, date]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("addBlackList(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function deleteSender(email) {
  const query = "delete from mail_google_sender where id= ?";
  try {
    const result = await pool.query(query, [email]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("deleteSender(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function InsertSearchlist(
  manualId,
  keyword,
  link,
  title,
  date,
  senderNo
) {
  const query = `insert into mail_searchlist (id, keyword, link, title, regdate, agent_no) values (?,?,?,?,?,?);`;

  try {
    const result = await pool.query(query, [
      manualId,
      keyword,
      link,
      title,
      date,
      senderNo,
    ]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("InsertSearchlist(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function sendListClear(senderId) {
  const query = `delete from mail_sendlist where agent_no=?;`;
  logger.info(`Agent ${senderId}에서 보낸 ID 초기화 수행함.`);
  try {
    const result = await executeQuery(query, [senderId]);
    return result.affectedRows > 0;
  } catch (error) {
    logger.error("functionName(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function getHtmlTemplate(senderId) {
  const query = "select * from template_html where agent_no=?";

  try {
    const [rows, fields] = await pool.query(query, [senderId]);
    return rows;
  } catch (error) {
    logger.error("getHtmlTemplate(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function setHtmlTemplate(
  templateName,
  contents,
  senderId,
  subject
) {
  const query = `INSERT INTO template_html (template_name, template,  agent_no, template_subject, regdate) VALUES (?,?,?,?,?);`;
  try {
    const result = await pool.query(query, [
      templateName,
      // encodedContents,
      contents,
      senderId,
      subject,
      getDate(),
    ]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("setHtmlTemplate(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function checkHtmlTemplate(templateName, senderId) {
  const query =
    "select template_name from template_html where template_name=? and agent_no=? limit 1";
  try {
    const [rows, fields] = await pool.query(query, [templateName, senderId]);
    return rows;
  } catch (error) {
    logger.error("checkHtmlTemplate(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function deleteHtmlTemplate(templateName, senderId) {
  const query =
    "delete from template_html where template_name=? and agent_no=?";
  try {
    const result = await pool.query(query, [templateName, senderId]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error(
      "deleteHtmlTemplate(): Error querying database:" + error.stack
    );
    throw error;
  }
}

export async function updateHtmlTemplate(
  templateName,
  contents,
  senderId,
  subject
) {
  const query = `UPDATE template_html SET template = ?, template_subject = ?, update_date = ?
  WHERE template_name=? AND agent_no=?`;
  try {
    const result = await pool.query(query, [
      contents,
      subject,
      getDate(),
      templateName,
      senderId,
    ]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("setHtmlTemplate(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function getDeliverySchedule() {
  const query = `SELECT * 
  FROM mail_delivery_schedule as mds
  ORDER BY no desc;`;
  try {
    const [rows, fields] = await pool.query(query);
    return rows;
  } catch (error) {
    logger.error(
      "getDeliverySchedule(): Error querying database:" + error.stack
    );
    throw error;
  }
}

export async function getDeliveryScheduleV2(senderGroupNum) {
  const query = `SELECT * 
  FROM mail_delivery_schedule as mds
  WHERE mds.sender_group = ?
  ORDER BY no desc;`;
  try {
    const [rows, fields] = await pool.query(query, [senderGroupNum]);
    return rows;
  } catch (error) {
    logger.error(
      "getDeliverySchedule(): Error querying database:" + error.stack
    );
    throw error;
  }
}

export async function updateMailDeliverySchedule(no, newSendStartTime) {
  const query = `UPDATE mail_delivery_schedule SET dispatch_registration_time = ? WHERE no = ?`;
  try {
    const result = await pool.query(query, [newSendStartTime, no]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("functionName(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function dbMailingRegistration(transInfos) {
  const insertScheduleQuery = `INSERT INTO mail_delivery_schedule ( 
    mail_agent,
    collection_id,
    sender_name,
    sender_group,
    dispatch_registration_time,
    reservation_sent,
    send_status,
    sender_id,
    sender_pw)
    VALUES ?;`;

  try {
    const {
      senderId,
      idList,
      senderName,
      senderGroup,
      subject,
      innerHTML,
      dispatch_registration_time,
      reservation_sent,
      send_status,
      senderEmailInfo,
    } = transInfos;

    // get id, pwd from mail_google_sender
    const emailString = senderEmailInfo.map((email) => email).join("','");
    const sensitiveInfoQuery = `SELECT DISTINCT id, password FROM mail_google_sender WHERE id IN ('${emailString}');`;
    const sensitiveInfo = await executeQuery(sensitiveInfoQuery);

    const purify = createPurifyInstance();

    const encodedSubject = regexHtml(await unEscapeHtml(subject));
    const cleanSubject = purify.sanitize(encodedSubject, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
    const groupId = await insertGroupAndContents(
      senderGroup,
      cleanSubject,
      innerHTML
    );

    delete transInfos["innerHTML"];
    delete transInfos["subject"];

    // bulk insert data
    const bulkInsertData = idList.map((collected_id, index) => {
      const { id: sender_id, password: sender_password } =
        sensitiveInfo[index % sensitiveInfo.length];
      return [
        senderId,
        collected_id + "@naver.com",
        senderName,
        groupId,
        dispatch_registration_time,
        reservation_sent,
        send_status,
        sender_id,
        sender_password,
      ];
    });

    await pool.query(insertScheduleQuery, [bulkInsertData]);

    return true;
  } catch (error) {
    logger.error("dbMailingRegistration(): Error querying database:" + error);
    throw error;
  }
}

async function insertGroupAndContents(groupName, mail_subject, body_content) {
  const query =
    "INSERT INTO mail_sender_group(name, date, title, contents) VALUES(?,?,?,?)";
  const result = await executeQuery(query, [
    groupName,
    getDate(),
    mail_subject,
    body_content,
  ]);
  return result.insertId;
}

export async function addSentList(id, senderId, senderEmail) {
  const query = `INSERT IGNORE INTO mail_sendlist (id, regdate, agent_no, sender_id) values (?,?,?,?);`;
  try {
    const result = await pool.query(query, [
      id,
      getDate(),
      senderId,
      senderEmail,
    ]);

    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("addSentList(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function getKeyWord(no) {
  const query = `SELECT * 
                FROM mail_keyword_new
                WHERE agent_no=?;`;
  try {
    const rows = await executeQuery(query, [no]);
    return rows;
  } catch (error) {
    logger.error("getKeyWord(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function insertKeyWord(keyword, senderId) {
  const query = `insert into mail_keyword_new (keyword, regdate, agent_no) values (?,?,?)`;
  try {
    const result = await pool.query(query, [keyword, getDate(), senderId]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("insertKeyWord(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function deleteKeyWord(no) {
  const query = `DELETE FROM mail_keyword_new WHERE no=?;`;
  try {
    const result = await pool.query(query, [no]);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("deleteKeyWord(): Error querying database:" + error.stack);
    throw error;
  }
}

export async function getAllowedSendingTimeRange() {
  const [rows, fields] = await pool.query(
    "SELECT start_time, end_time FROM mail_delivery_timezone LIMIT 1"
  );
  if (rows.length > 0) {
    return { startTime: rows[0].start_time, endTime: rows[0].end_time };
  }
  return false;
}

export async function deleteKeyWordList(noList) {
  const placeholders = noList.map(() => "?").join(",");
  const query = `DELETE FROM mail_keyword_new
  WHERE no IN (${placeholders})`;

  try {
    const result = await pool.query(query, noList);
    return result[0].affectedRows > 0;
  } catch (error) {
    logger.error("deleteKeyWordList(): querying database:" + error.stack);
    throw error;
  }
}

export async function getMailGroupState() {
  const query = `
    SELECT
      msg.no,
      msg.name,
      mds.sender_group,
      msg.group_suspend,
      COUNT(*) AS total_deliveries,
      SUM(CASE WHEN mds.send_status = 'sending' THEN 1 ELSE 0 END) AS delivery_in_progress,
      SUM(CASE WHEN mds.send_status = 'finished' THEN 1 ELSE 0 END) AS delivery_completed,
      SUM(CASE WHEN mds.send_status = 'failed' THEN 1 ELSE 0 END) AS delivery_failed,
      SUM(CASE WHEN mds.mail_read_status = 'y' THEN 1 ELSE 0 END) AS read_mail,
      SUM(CASE WHEN mds.send_status NOT IN ('finished', 'failed') THEN 1 ELSE 0 END) AS remains
  FROM
      mail_sender_group AS msg
      INNER JOIN mail_delivery_schedule AS mds ON msg.no = mds.sender_group
  GROUP BY
      mds.sender_group
  ORDER BY
      msg.date DESC;
  `;
  try {
    const [rows, fields] = await pool.query(query);
    return rows;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

export async function getMailGroupStateDetail(groupNo) {
  const query = `
  SELECT
    msg.title, 
    msg.contents
  FROM 
    mail_sender_group as msg
  WHERE 
    msg.no = ?;`;
  try {
    const [rows, fields] = await pool.query(query, [groupNo]);
    return rows;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getSuperIds() {
  const query = "select super_id from super_id_list";
  try {
    const [rows, fields] = await pool.query(query);
    // return array of object
    return rows;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

export async function getMailUnsubscribe(email) {
  const query = `select email from mail_unsubscribe where email = ? limit 1`;
  try {
    const superIDs = await getSuperIds();
    const filteredArr = superIDs.map((ids) => ids.super_id);

    if (filteredArr.includes(email.split("@")[0])) {
      return [];
    }

    const [rows, fields] = await pool.query(query, [email]);
    return rows;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

export async function getMemberId(idList) {
  const placeholders = idList.map(() => "?").join(",");
  const query = `SELECT blog_id, nickname FROM __blogger WHERE blog_id IN (${placeholders})`;
  try {
    const [rows, fields] = await pool.query(query, idList);
    return rows;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

/**
 * @description - DB에서 하이웍스 계정명을 변경하는 함수
 * @param oldId
 * @param newId
 * @returns {Promise<boolean>}
 */
export async function updateSender(oldId, newId, domain) {
  const lockQuery =
    "SELECT * FROM mail_delivery_schedule WHERE sender_id = ? AND send_status IN ('immediately', 'scheduled') FOR UPDATE;";
  const queryGoogleSender =
    "UPDATE mail_google_sender SET id = ? WHERE id = ?;";
  const queryDeliverySchedule =
    "UPDATE mail_delivery_schedule SET sender_id = ? WHERE sender_id = ? AND send_status IN ('immediately', 'scheduled', 'sending');";

  const fullNewId = newId.includes("@") ? newId : `${newId}@${domain}`;
  const fullOldId = `${oldId}@${domain}`;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(lockQuery, oldId);

    const resultGoogleSender = await connection.query(queryGoogleSender, [
      fullNewId,
      fullOldId,
    ]);

    if (resultGoogleSender[0].affectedRows > 0) {
      // mail_delivery_schedule 테이블 업데이트
      const resultDeliverySchedule = await connection.query(
        queryDeliverySchedule,
        [fullNewId, oldId]
      );
      await connection.commit();
      return resultDeliverySchedule[0].affectedRows > 0;
    } else {
      await connection.rollback();
      return false;
    }
  } catch (error) {
    logger.error(error.stack);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getSenderAll() {
  const query = `
    SELECT 
      ma.name, mgs.id
    FROM
      mail_google_sender mgs, mail_agent ma
    WHERE
      mgs.agent_no = ma.no
    ORDER BY 
      ma.no ASC;
  `;

  try {
    const [rows, fields] = await pool.query(query);
    return rows;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

// delete group from mail_delivery_schedule where sender_group=?
export async function deleteGroup(groupNo) {
  const query = "DELETE FROM mail_delivery_schedule WHERE sender_group = ?";
  try {
    const result = await executeQuery(query, [groupNo]);
    return result.affectedRows > 0;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

// suspendGroup in mail_sender_group where no=?
export async function suspendGroup(groupNo) {
  const query = "UPDATE mail_sender_group SET group_suspend = 'Y' WHERE no = ?";
  try {
    const result = await executeQuery(query, [groupNo]);
    return result.affectedRows > 0;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

// reopenGroup in mail_sender_group where no=?
export async function reopenGroup(groupNo) {
  const query = "UPDATE mail_sender_group SET group_suspend = 'N' WHERE no = ?";
  try {
    const result = await executeQuery(query, [groupNo]);
    return result.changedRows > 0;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

export async function getGroupDeliveryCount(groupNo) {
  const query = `SELECT COUNT(*) as count
  FROM mail_delivery_schedule
  WHERE sender_group = ?
  AND send_status NOT IN ('finished', 'failed');`;

  try {
    const [rows, fields] = await pool.query(query, [groupNo]);
    return rows[0].count;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

export async function getSenderTemplateAll() {
  const query = `
  SELECT
    ma.no, ma.name, th.template_name, th.template_subject, th.no as template_no
  FROM
    template_html th
    LEFT JOIN mail_agent ma ON th.agent_no = ma.no
  WHERE
    th.template_subject IS NOT NULL
  ORDER BY 
    ma.no DESC;
  `;

  try {
    const rows = await executeQuery(query);
    return rows;
  } catch (error) {
    throw error;
  }
}

// query for getSpecificTemplate(no)
export async function getSpecificTemplate(no) {
  const query = `
  SELECT
    th.no, th.template_name, th.template, th.template_subject
  FROM
    template_html th
  WHERE
    th.no = ?;
  `;

  try {
    const rows = await executeQuery(query, [no]);
    return rows[0];
  } catch (error) {
    throw error;
  }
}

// query for updateHtmlTemplateContents(no, contents)
export async function updateHtmlTemplateContents(
  no,
  templateName,
  title,
  contents
) {
  const query = `
  UPDATE template_html
  SET
    template_name = ?,
    template_subject = ?,
    template = ?
  WHERE no = ?;
  `;

  try {
    const result = await executeQuery(query, [
      templateName,
      title,
      contents,
      no,
    ]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

// query for deleteHtmlTemplateList(noList)
export async function deleteHtmlTemplateList(noList) {
  const placeholders = noList.map(() => "?").join(",");
  const query = `DELETE FROM template_html WHERE no IN (${placeholders})`;

  try {
    const result = await executeQuery(query, noList);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

export async function getSenderEmails() {
  const query = `SELECT DISTINCT no, id
    FROM mail_google_sender mgs`;

  try {
    return await executeQuery(query);
  } catch (error) {
    throw error;
  }
}

export async function insertSenderEmailAgent(mail_no, agent_no) {
  const query =
    "INSERT INTO mail_allocation_registry (mail_no, agent_no) VALUES (?, ?);";

  try {
    const result = await executeQuery(query, [mail_no, agent_no]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

export async function disableSenderEmailAgent(mail_no, agent_no) {
  const updateQuery =
    "DELETE FROM mail_allocation_registry WHERE agent_no = ? and mail_no = ? limit 1;";
  try {
    const result = await executeQuery(updateQuery, [agent_no, mail_no]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

export async function unassignAllEmails() {
  const query = "DELETE FROM mail_allocation_registry;";
  try {
    const result = await executeQuery(query);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

export async function isEmailUsing(email) {
  const query = `
    SELECT mar.*, ma.name
    FROM mail_google_sender mgs
    JOIN mail_allocation_registry mar ON mgs.no = mar.mail_no
    JOIN mail_agent ma ON mar.agent_no = ma.no
    WHERE mgs.id = ?;
    `;

  try {
    const rows = await executeQuery(query, [email]);
    return rows;
  } catch (error) {
    throw error;
  }
}

export async function getCurrentMailAllocationStatus() {
  const query = `
    SELECT mar.mail_no, mar.agent_no, ma.name
    FROM mail_allocation_registry mar
    JOIN mail_agent ma ON mar.agent_no = ma.no;
    `;

  try {
    const rows = await executeQuery(query);
    return rows;
  } catch (error) {
    throw error;
  }
}

export async function getErrorMessageSummary(groupNo) {
  const query = `
  SELECT 
    mds.error_message err
  FROM
    mail_delivery_schedule mds
  WHERE
    mds.error_message != ''
    AND mds.sender_group = ?
  GROUP BY 
    mds.error_message;
  `;

  try {
    const rows = await executeQuery(query, [groupNo]);
    return rows;
  } catch (error) {
    throw error;
  }
}

export async function getTodaySendedGroup() {
  const query = `
  SELECT
    msg.no,
    msg.name,
    mds.sender_group,
    dispatch_registration_time,
    msg.group_suspend,
    COUNT(*) AS total_deliveries,
    SUM(CASE WHEN mds.send_status = 'sending' THEN 1 ELSE 0 END) AS delivery_in_progress,
    SUM(CASE WHEN mds.send_status = 'finished' THEN 1 ELSE 0 END) AS delivery_completed,
    SUM(CASE WHEN mds.send_status = 'failed' THEN 1 ELSE 0 END) AS delivery_failed,
    SUM(CASE WHEN mds.mail_read_status = 'y' THEN 1 ELSE 0 END) AS read_mail,
    SUM(CASE WHEN mds.send_status NOT IN ('finished', 'failed') THEN 1 ELSE 0 END) AS remains
  FROM
    mail_sender_group AS msg
    INNER JOIN mail_delivery_schedule AS mds ON msg.no = mds.sender_group
    AND dispatch_registration_time >= NOW() - INTERVAL 24 HOUR
  GROUP BY
    mds.sender_group
  ORDER BY
    msg.no DESC;
  `;

  try {
    const rows = await executeQuery(query);
    return rows;
  } catch (error) {
    throw error;
  }
}

export async function getWeekSendedGroup() {
  const query = `
  SELECT
    msg.no,
    msg.name,
    mds.sender_group,
    dispatch_registration_time,
    msg.group_suspend,
    COUNT(*) AS total_deliveries,
    SUM(CASE WHEN mds.send_status = 'sending' THEN 1 ELSE 0 END) AS delivery_in_progress,
    SUM(CASE WHEN mds.send_status = 'finished' THEN 1 ELSE 0 END) AS delivery_completed,
    SUM(CASE WHEN mds.send_status = 'failed' THEN 1 ELSE 0 END) AS delivery_failed,
    SUM(CASE WHEN mds.mail_read_status = 'y' THEN 1 ELSE 0 END) AS read_mail,
    SUM(CASE WHEN mds.send_status NOT IN ('finished', 'failed') THEN 1 ELSE 0 END) AS remains
  FROM
    mail_sender_group AS msg
    INNER JOIN mail_delivery_schedule AS mds ON msg.no = mds.sender_group
    AND dispatch_registration_time >= NOW() - INTERVAL 7 DAY
  GROUP BY
    mds.sender_group
  ORDER BY
    msg.no DESC;
  `;

  try {
    const rows = await executeQuery(query);
    return rows;
  } catch (error) {
    throw error;
  }
}

export async function getAgentList() {
  const query = `
  SELECT
    cu.no, cu.name
  FROM
    __customer cu
  ORDER BY 
    cu.name ASC;
  `;

  try {
    const rows = await executeQuery(query);
    return rows;
  } catch (error) {
    throw error;
  }
}

export async function getStoreList() {
  const query = `
  SELECT
    s.no, s.store_name name, s.manager_name m_name
  FROM
    __store s  
  ORDER BY
    store_name ASC;
  `;

  try {
    const rows = await executeQuery(query);
    return rows;
  } catch (error) {
    throw error;
  }
}

export async function usersWhoHaveAlreadyJoined(date, agent_no, store_no) {
  let agent_query = "";
  let store_query = "";
  let date_query = "";
  let params = [];

  if (agent_no?.length > 0) {
    const agentPlaceholders = agent_no.map(() => "?").join(",");
    agent_query = `or CU.no IN (${agentPlaceholders})`;
    params.push(...agent_no);
  }

  if (store_no?.length > 0) {
    const storePlaceholders = store_no.map(() => "?").join(",");
    store_query = `or S.no IN (${storePlaceholders})`;
    params.push(...store_no);
  }

  if (date) {
    date_query = "and P.ticket_gen_time >= ?";
    params.push(date);
  }

  const query = `
    select CU.no AS customer_no, S.no AS Store_no, B.nickname, B.blog_id, P.status, P.ticket_gen_time
    from __progress P 
    left join __campaign C on P.campaign_no = C.no
    left join __store S on C.store_no = S.no
    left join __customer CU on CU.no = S.customer_no
    left join __blogger B on P.blogger_no = B.no
    WHERE 
    P.status >= 4
    AND (
      (0 ${agent_query})
      OR
      (0 ${store_query})
    )
    AND (1 ${date_query})`;

  try {
    const rows = await executeQuery(query, params);
    return rows;
  } catch (error) {
    throw error;
  }
}

export async function updateMailContents(no, mailTitle, mailContent) {
  const query = `
    UPDATE mail_sender_group
    SET
      title = ?,
      contents = ?
    WHERE no = ?;`;

  try {
    const result = await executeQuery(query, [mailTitle, mailContent, no]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

export async function getFilterTemplateAll() {
  const query = `
  SELECT
    tf.no, tf.filter_name, tf.filter_obj
  FROM
    template_filter tf
  ORDER BY 
    tf.no DESC;
  `;

  try {
    const rows = await executeQuery(query);
    return rows;
  } catch (error) {
    throw error;
  }
}

export async function setFilterTemplate(filterName, filterArray) {
  const query = `
  INSERT INTO template_filter (filter_name, filter_obj)
  VALUES (?, ?);
  `;

  try {
    const result = await executeQuery(query, [
      filterName,
      JSON.stringify(filterArray),
    ]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

export async function deleteSpecificFilterList(noList) {
  const placeholders = noList.map(() => "?").join(",");
  const query = `DELETE FROM template_filter WHERE no IN (${placeholders})`;

  try {
    const result = await executeQuery(query, noList);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

export async function getThisGroupsSender(groupNo) {
  const query = `
    SELECT distinct
      mds.sender_id email
    FROM
      mail_delivery_schedule mds
    WHERE
      mds.sender_group = ?;`;

  try {
    return await executeQuery(query, [groupNo]);
  } catch (error) {
    throw error;
  }
}

export async function changeSenderEmail(no, targetEmail) {
  const query = `
    UPDATE mail_delivery_schedule
    SET
      sender_id = ?
    WHERE sender_group = ?;`;

  try {
    const result = await executeQuery(query, [targetEmail, no]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

export async function changeServerName(no, newServerName) {
  const query = `update mail_server_status set server_name = ? where no = ?`;
  try {
    const result = await executeQuery(query, [newServerName, no]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

export async function deleteServer(no) {
  const query = `delete from mail_server_status where no = ?`;
  try {
    const result = await executeQuery(query, [no]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

export async function storeHash(cno) {
  const insertQuery = "INSERT INTO rhash(hash, campaign_no) VALUES (?, ?)";
  const checkQuery = "SELECT hash FROM rhash WHERE hash = ? LIMIT 1";

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      const hash = createHash(cno);
      const isExist = await executeQuery(checkQuery, [hash]);

      if (isExist.length === 0) {
        const res = await executeQuery(insertQuery, [hash, cno]);
        return { isSuccess: true, hash };
      }
      attempts++;
    } catch (e) {
      console.error("Error in storeHash:", e);
      throw e;
    }
  }
  throw new Error("해시 생성 시도 실패가 최대 시도 횟수(10)를 초과함");
}

function createHash(cno) {
  const timestamp = Date.now();
  const hashInput = `${timestamp}${cno}`;
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

export async function getAllSuperAccounts() {
  const query = `SELECT * FROM super_id_list`;
  return await executeQuery(query);
}

export async function addSuperAccount(superId) {
  const query = `INSERT INTO super_id_list (super_id) VALUES(?)`;
  const result = await executeQuery(query, [superId]);
  return { no: result.insertId, super_id: superId, is_emergency: "N" };
}

export async function deleteSuperAccount(id) {
  const query = `DELETE FROM super_id_list WHERE no = ?`;
  await executeQuery(query, [id]);
}

export async function toggleEmergency(id, isEmergency) {
  const state = JSON.parse(isEmergency) ? "Y" : "N";
  const query = `UPDATE super_id_list SET is_emergency = ? WHERE no = ?`;
  await executeQuery(query, [state, id]);
}

export async function updateJisuLog(postingInfoArrObj, keyword) {
  const connection = await pool.getConnection();

  let params;
  try {
    await connection.beginTransaction();

    for (const post of postingInfoArrObj) {
      // 1. __blogger 테이블에서 nickname 찾기
      const [bloggerRows] = await connection.query(
        `SELECT no, nickname FROM __blogger WHERE blog_id = ?`,
        [post.id]
      );
      const nickname = bloggerRows.length > 0 ? bloggerRows[0].nickname : null;
      const blogger_no = bloggerRows.length > 0 ? bloggerRows[0].no : null;

      const mysqlRegDate = parseDate(post.regDate);

      params = [
        blogger_no,
        post.id,
        nickname,
        keyword,
        post.postingUrl,
        post.subject,
        post.rawScore,
        mysqlRegDate, // 변환된 DATE 형식
        post.rank,
        "사용x",
      ];

      // 삽입
      await connection.query(
        `INSERT INTO jisu_log (
              blog_no, 
              blog_id, 
              nickname, 
              keyword,
              post_link, 
              post_title, 
              jisu, 
              reg_date, 
              search_date, 
              rank,
              keyword_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
        params
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function parseDate(dateString) {
  if (!dateString || dateString.trim() === "") {
    return null;
  }

  try {
    // 공백으로 분리하여 첫 번째 부분(날짜)만 사용
    const datePart = dateString.trim().split(" ")[0];

    // yyyy-mm-dd 형식인지 확인
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }

    // 다른 형식의 날짜 문자열 처리 (기존 로직)
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }

    throw new Error("Invalid date format");
  } catch (error) {
    console.error("날짜 파싱 오류:", dateString, error);
    return null;
  }
}
