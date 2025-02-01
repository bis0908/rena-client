import { connectedClients, io } from "./socketService.js";

import axios from "axios";
import logger from "../config/logger.js";
import puppeteer from "puppeteer";

const inputIDSelector = 'input[placeholder="로그인 ID"]';
const inputPWSelector = 'input[placeholder="비밀번호"]';
const userName = "리뷰나비";

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const COKR = {
  // Confidential
};

const KR = {
  // Confidential
};

const hiworksDotCom = (domain) => ({
  // Confidential
});

const urlOptions = {
  timeout: 5000,
  waitUntil: "domcontentloaded",
};

// function for goto loginUrl page
async function goToLoginPage(page, site) {
  await page.goto(site.loginURL, urlOptions);
  await page.setViewport({ width: 1024, height: 1080 });

  await page.waitForSelector(inputIDSelector);
  // typing
  await page.type(inputIDSelector, site.id);
  await page.keyboard.press("Enter");

  await page.waitForSelector(inputPWSelector);
  await page.type(inputPWSelector, site.pw);
  await page.keyboard.press("Enter");
  return await sleep(1000);
}

export async function changeAccountName(oldId, newId, domain) {
  let site = domainCheck(domain);
  const result = await isExistId(newId, site);

  if (result) {
    site = null;
    return { success: false, message: "이미 존재하는 ID 입니다." };
  } else {
    try {
      const isSuccess = await changeIdBrowserControl(oldId, newId, site);
      if (isSuccess) {
        await sleep(500);
        const afterChange = await isExistId(newId, site);
        if (afterChange) {
          site = null;
          return { success: true, message: "아이디 변경 성공!" };
        } else {
          return { success: false, message: "아이디 변경 실패" };
        }
      }
    } catch (error) {
      console.error(error);
      return { success: false, message: error };
    }
  }
}

function domainCheck(domain) {
  if (domain.endsWith("co.kr")) {
    return Object.assign({}, COKR);
  } else {
    return Object.assign({}, KR);
  }
}

async function changeIdBrowserControl(oldId, newId, site) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const [page] = await browser.pages();

    // page handler
    page.on("dialog", async (dialog) => {
      switch (dialog.type()) {
        case "prompt":
          await dialog.dismiss();
          break;

        case "confirm":
          if (dialog.message().includes("사용자의 ID를 변경하시겠습니까?")) {
            await dialog.accept();
          } else {
            await dialog.dismiss();
          }
          break;

        case "alert":
          await dialog.dismiss();
          break;

        default:
          await dialog.dismiss();
          break;
      }
    });

    await goToLoginPage(page, site);

    await page.goto(site.manageUserURL, urlOptions);

    await page.waitForSelector(site.tableUserSelector, { visible: true });
    const links = await page.$$(site.tableUserLink);

    for (const link of links) {
      const linkText = await (
        await link.getProperty("textContent")
      ).jsonValue();
      if (linkText.trim() === oldId) {
        console.log("click user id link");
        await link.click();
        break;
      }
    }

    await page.waitForSelector(site.userIdChangeButtonSelector, {
      timeout: 5000,
    });

    await page.$eval(site.userIdChangeButtonSelector, (elem) => elem.click());

    await page.waitForSelector(site.userIdChangeInput);
    await page.type(site.userIdChangeInput, newId);
    await sleep(1000);
    await page.$eval(site.useridChangeButton, (elem) => elem.click());
    return true;
  } catch (error) {
    logger.error(error);
    throw error;
  } finally {
    if (browser) {
      await sleep(500);
      await browser.close();
      console.log("browser closed");
    }
  }
}

function isExistId(id, site) {
  const config = {
    method: "get",
    url: "https://api.hiworks.com/hrm/v2/users",
    headers: {
      Authorization: `Bearer ${site.token}`,
      "Content-Type": "application/json",
    },
  };

  return axios(config)
    .then((res) => {
      for (const obj of res.data) {
        if (obj.user_id === id) {
          return true;
        }
      }
      return false;
    })
    .catch((e) => {
      console.error(e);
      return new Error(e);
    });
}

export async function addNewHiworksMail(email, password, mySocketId) {
  const [id, domain] = email.split("@");

  let site = hiworksDotCom(domain);
  console.log(site.loginURL);

  const browser = await puppeteer.launch({
    headless: false,
  });
  try {
    const [page] = await browser.pages();
    io.sockets.sockets.get(mySocketId).emit("progress", 20);

    page.on("error", async (err) => {
      await browser.close();
      throw err;
    });

    await goToLoginPage(page, site);

    await page.goto(site.addUserURL, urlOptions);

    await page.waitForSelector(site.inputName).then(() => {
      page.type(site.inputName, userName);
    });
    await sleep(500);
    await page.type(site.inputID, id);
    await page.click(site.pwRadio);
    await sleep(500);
    await page.type(site.adminPwInput, site.tempPw);
    const isDisabled = await page.$eval(
      ".license-wrap li:nth-child(1) > label > div.hu-checkbox > input",
      (el) => el.disabled
    );
    if (isDisabled) {
      throw new Error("이미 모든 메일을 사용 중입니다.");
    } else {
      await page.click(site.assignMail);
      const remainMails = await page.$eval(
        "ul.license-wrap > li:first-child label.hu-checkbox-wrapper span.title",
        (el) => el.textContent.trim()
      );
      await page.click(site.saveBtn);

      await popUpMessageHandler(page, browser);

      await page.waitForSelector(site.modal, { visible: true });
      await sleep(500);
      await page.click(site.closeBtn);
      io.sockets.sockets.get(mySocketId).emit("progress", 40);
      // logout and login again using new id
      await page.goto(site.logoutUrl, urlOptions);
      await page.waitForSelector(site.changeIdBtn, { visible: true });
      await page.click(site.changeIdBtn);
      io.sockets.sockets.get(mySocketId).emit("progress", 60);
      await page.type(inputIDSelector, id);
      await page.keyboard.press("Enter");
      await page.waitForSelector(inputPWSelector);
      await page.type(inputPWSelector, site.tempPw);
      await page.keyboard.press("Enter");
      await sleep(500);
      await page.type(site.changePwInput1, site.tempPw);
      await page.type(site.changePwInput2, site.pw);
      await page.type(site.changePwInput3, site.pw);
      await page.click(site.submit);
      await sleep(500);
      io.sockets.sockets.get(mySocketId).emit("progress", 80);
      // login new id for config pop3
      await page.goto(site.mailConfigUrl, urlOptions);
      await page.waitForSelector(site.usePop3Radio, { visible: true });
      await page.click(site.usePop3Radio);
      await page.select(site.allowPop3CountrySelect, "KR");
      await page.click(site.userConfigSaveBtn);
      io.sockets.sockets.get(mySocketId).emit("progress", 100);
      return { isSuccess: true, message: remainMails };
    }
  } catch (error) {
    logger.error(error + " / " + email);
    throw error;
  } finally {
    if (browser) {
      await sleep(500);
      await browser.close();
      console.log("browser closed");
    }
  }
}

/**
 * @param {puppeteer.Page} page
 * @param {puppeteer.Browser} browser
 */
async function popUpMessageHandler(page, browser) {
  return new Promise((resolve, reject) => {
    page.on("dialog", async (dialog) => {
      const popUpMessage = dialog.message().trim();

      switch (dialog.type()) {
        case "prompt":
          await dialog.dismiss();
          resolve(true);
          break;

        case "confirm":
          await dialog.dismiss();
          resolve(true);
          break;

        case "alert":
          if (popUpMessage.includes("이미 사용 중인")) {
            reject(new Error(popUpMessage));
          } else if (popUpMessage.includes("이용할 수 없습니다")) {
            reject(new Error(popUpMessage));
          } else if (popUpMessage.includes("저장되었습니다.")) {
            await dialog.accept();
            await browser.close();
            resolve(true);
          }
          break;
      }
    });
  });
}

/**
 * @description delete email from hiworks.com
 * @param willRemoveEmail string
 * @returns {Promise<boolean>}
 */
export async function deleteEmailFromHiworks(willRemoveEmail) {
  const [id, domain] = willRemoveEmail.split("@");

  let site = hiworksDotCom(domain);

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const [page] = await browser.pages();

    page.on("error", async (err) => {
      await browser.close();
      throw err;
    });

    await goToLoginPage(page, site);

    await page.goto(site.manageUserURL, urlOptions);

    await page.waitForSelector(site.tableUserSelector, { visible: true });
    const links = await page.$$(site.tableUserLink);

    for (const link of links) {
      const linkText = await (
        await link.getProperty("textContent")
      ).jsonValue();
      if (linkText.trim() === id) {
        console.log("click user id link");
        await page.evaluate(async (id) => {
          const targetRow = Array.from(document.querySelectorAll("tr")).find(
            (row) => row.querySelector(".user_id .label")?.textContent === id
          );

          if (targetRow) {
            const checkboxInput = targetRow.querySelector(
              'input[type="checkbox"]'
            );
            if (checkboxInput) {
              checkboxInput.click();
            }
          }
        }, id);
        break;
      }
    }

    await page.waitForSelector(site.deleteBtn, { visible: true });
    await page.click(site.deleteBtn);
    await sleep(500);

    await page.evaluate(() => {
      const labels = document.querySelectorAll(".modal-content__body label");
      labels.forEach((label) => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.click();
        }
      });
    });

    await page.click(site.modalDelBtn);
    await sleep(500);
    await page.click(site.confirmBtn);
    await page.goto(site.deactivatedUsersUrl, urlOptions);
    await page.waitForSelector(site.selectAllUsers);
    await page.click(site.selectAllUsers);
    await sleep(500);
    await page.click(site.deleteForeverLink);
    await page.click(site.deleteConfirmLabel);
    await page.click(site.modalDelBtn);

    return true;
  } catch (error) {
    logger.error(error);
    throw error;
  } finally {
    if (browser) {
      await sleep(500);
      await browser.close();
      console.log("browser closed");
    }
  }
}
