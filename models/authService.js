import logger from "../config/logger.js";
import { pool } from "../config/dbConfig.js";

async function executeQuery(query, params) {
  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

export async function serverLogin(password) {
  const query = "SELECT * FROM login_renamailer WHERE `password` = SHA2(?, 256);";
  const result = await executeQuery(query, [password]);
  return result.length > 0;
}

export async function changePassword(currentPw, newPw) {
  const selectQuery = "SELECT * FROM login_renamailer WHERE `password` = SHA2(?, 256);";
  const updateQuery = "UPDATE login_renamailer SET `password` = SHA2(?, 256) WHERE `password` = SHA2(?, 256);";

  const result = await executeQuery(selectQuery, [currentPw]);
  if (result.length > 0) {
    await executeQuery(updateQuery, [newPw, currentPw]);
    return true;
  }
  return false;
}
