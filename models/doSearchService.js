import { load } from "cheerio";

import axios from "axios";
import logger from "../config/logger.js";
import { executeQuery } from "../config/dbConfig.js";

// const regexTotalCnt = /"total"\s*:\s*(\d+)/;
const regexUrl = /[^/.]+/g;
// const regexGdid = /[\w\d]+_[\w\d]+/g;
const commentRegex = /r[0-9]+:.+\n/g; //24년 2월 1일 변경 된 지수 파싱 대응
const feedIdRegex = /feedId\s*:\s*\[["']([^"']+)["']\]/;
// const idRegex = /\"(.*?)\"/;

const userInfo = ".user_info a";
const blogUrl = ".title_area a";
// const subTime = "span.sub_time.sub_txt";
const titleArea = ".title_area a";
const dscArea = ".dsc_area a";
const dataCrGdid = "data-cb-target";

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/115.0.5790.130 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/115.0.5790.130 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPod; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/115.0.5790.130 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-N960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; LM-Q720) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; LM-X420) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; LM-Q710(FGN)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13.4; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/115.0 Mobile/15E148 Safari/605.1.15",
  "Mozilla/5.0 (iPad; CPU OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/115.0 Mobile/15E148 Safari/605.1.15",
  "Mozilla/5.0 (iPod touch; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) FxiOS/115.0 Mobile/15E148 Safari/605.1.15",
  "Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/115.0 Firefox/115.0",
  "Mozilla/5.0 (Android 13; Mobile; LG-M255; rv:115.0) Gecko/115.0 Firefox/115.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPod touch; CPU iPhone 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
];

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

function regexHtml(dom) {
  // logger.info("type of dom: " + typeof dom);
  try {
    dom = String(dom);
    dom = dom.replace(/=""/g, "");
    dom = dom.replace(/\"/g, "");
    dom = dom.replace(/\\/g, "\"");

    return dom;
  } catch (error) {
    logger.error(error.stack);
    return false;
  }
}

function unEscapeHtml(str) {
  return new Promise((resolve, reject) => {
    str = str.toString();
    if (str == null) {
      logger.error("str is null");
    }
    resolve(
      str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'"),
    );
  });
}

async function getHTML(url) {
  try {
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
    const options = {
      headers: {
        "User-Agent": ua,
        Referer: "https://m.search.naver.com",
        Origin: "https://m.search.naver.com",
      },
    };

    const { data } = await axios.get(url, options).catch((error) => {
      if (error.response) {
        logger.error("Response Data: " + error.response.data);
        logger.error("Response Status: " + error.response.status);
        logger.error("Response Headers: " + error.response.headers);
        logger.error("Config: " + JSON.stringify(error.config));
      } else if (error) {
        logger.error(
          "No response was received: " + JSON.stringify(error.toJSON()),
        );
      } else {
        logger.error("Error message: " + error.message);
      }
    });
    // logger.info("axios get data: " + data);
    return load(data);
  } catch (error) {
    logger.error(error.stack);
    logger.error(url);

    throw error;
  }
}

export async function replaceAttr(query, i) {
  query = query.replace(/start=[0-9]+/, `start=${i}`);
  //24년 2월 4일 업데이트   prank 추가
  query = query.replace(/prank=[0-9]+/, `prank=${i - 1}`);
  //24년 2월 4일 업데이트  api_type를 2->1  에서  3->2로 변경
  query = query.replace(/api_type=7/, "api_type=6");
  query = query.replace(/ac=0/, "ac=1");
  //query = query.replace(/mode=image/, "mode=normal");//24년 2월 4일 업데이트   삭제
  //query = query.replace(/mode=timeline/, "mode=normal");//24년 2월 4일 업데이트   삭제
  return query;
}

//24년 2월 1일 업데이트 정규식으로 next url을 파싱해와야 하게 변경 됨.
/*
function getNextUrl(html) {
  // 2024년 2월 1일 변경
  // 정규식에서 가져오도록 변경
  var pattern =
    /https:\/\/s\.search\.naver\.com\/p\/review\/47\/search\.naver\?ssc=tab\.m_blog\.all&api_type=(\d+)&query=([^&]+)&(.*?)_callback=getBlogContents/;
  var match = html.match(pattern);
  if (match) {
    return match[0];
  }
  return "";
}*/

// 2024년 4월 4일 패치 대응
// 아예 nextUrl : https...url... 형태를 찾게 만듬.  혹시 URL이 달라져도 찾을 수 있도록
// todo: 이것을 못찾을 떄 오류 로그 및 UI로 알려줄 필요가 있음.
function getNextUrl(html) {
  var pattern = /"nextUrl":\s*"(https?:\/\/[^"]+)"/;
  var match = html.match(pattern);
  if (match) {
    // match[1]을 사용하여 실제 URL 부분만 반환
    return match[1];
  } else {
    logger.error("getNextUrl: nextUrl을 찾을 수 없습니다.");
  }
  return "";
}

/*
24년 2월 1일 업데이트   키워드 추가, 기본 data api에 사용
*/
export async function crawlingId(url, score1, score2, keyword) {
  // async function scrapeData() {
  logger.info("crawling url: " + url);
  logger.info("keyword: " + keyword);

  const postByPage = 30;

  try {
    const $ = await getHTML(url);

    /*
     * Extract data-api class from first url
     */
    // 24년 2월 1일 업데이트
    // 정규식으로 nextURL을 파싱하도록 수정
    // HTML 을 string으로 가져온다.
    const htmlString = $.html();
    let dataApi = getNextUrl(htmlString);
    console.log(dataApi);
    if (dataApi === "") {
      dataApi = `https://s.search.naver.com/p/review/47/search.naver?ssc=tab.m_blog.all&api_type=3&query=${keyword}&start=31&nx_search_query=&nx_and_query=&nx_sub_query=&ac=0&aq=0&spq=0&sm=mtb_jum&nso=&prank=30&ngn_country=KR`;
    }

    /*
     * To check the value of a parameter in a URL
     */
    //24년 2월 1일 nqx theme 가 사라짐
    // const nqx_theme = "사용X";

    //24년 2월 1일 페이지 카운터를 더 이상 파싱할 수 없음
    //그래서 가지고 올 수 있을 때 까지 가지고 온 후 해당 개수를 카운트 해야 함.

    let postingInfoArr = [];
    var isStop = false;
    let rank = 0;
    for (let i = 1; i <= 10; i++) {
      await sleep(500);
      //24년 2월 1일 업데이트  위 for문을 무한루프로 바꾸고 더 이상 추가할 게 없으면 끝낸다.
      if (isStop) {
        break;
      }

      logger.info("page crawling: " + i);
      dataApi = await replaceAttr(dataApi, (i - 1) * postByPage + 1);
      try {
        let nextUrl = await getHTML(dataApi);
        let postScores = [];
        const postScore = getCommentsFromDOM(nextUrl);
        if (postScore == false) {
          isStop = true;
          continue;
        }

        // * after 23.10.19
        let posts = nextUrl("div.view_wrap");
        // logger.info("posts: " + posts);
        if (posts == null || 0) {
          continue;
        }
        const postsCount = posts.length;
        let pageInContents = postByPage;

        if (postsCount > postByPage) {
          pageInContents = postsCount;
          logger.info("postsCount > postByPage: ", pageInContents);
        }

        for (let j = 0; j < pageInContents; j++) {
          postScores.push(postScore[j]);
        }

        posts.each((_index, element) => {
          const postings = {};
          const isBlog = $(element).find(blogUrl).attr("href");
          const matchBlog = isBlog.match((regexUrl));

          if (matchBlog[2] === "blog") {
            const splitted = postScores[_index];
            const utc = splitted.split(":").at(-1);
            const score = parseFloat(splitted.split(":")[3]);
            const id = matchBlog[matchBlog.length - 2];
            postings.blogName = $(element).find(userInfo).text();
            postings.postingUrl = $(element).find(blogUrl).attr("href");
            postings.regDate = convertUTCtoKST(utc);
            postings.subject = $(element).find(titleArea).text().trim();
            postings.contents = $(element).find(dscArea).text().trim();
            postings.gdid = $(element).find(titleArea).attr(dataCrGdid);
            postings.id = id;
            postings.score = parseFloat(score.toFixed(3));
            postings.rawScore = score;
            postings.rank = ++rank;
            postingInfoArr.push(postings);
          }

          // const url = postings.postingUrl.match(regexUrl);
          // if (url[2] == "blog") {
          // }

        });

        // logger.info("postingInfo: " + JSON.stringify(postingInfoArr));
      } catch (error) {
        logger.error(error);
      }
    }

    return postingInfoArr;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 *
 * @param {cheerio.Object} dom
 * @returns Array of String
 */

function getCommentsFromDOM(dom) {
  /*
   * get comments in html, using regex
   */
  let comments;

  try {
    comments = dom("*")
    .contents()
    .filter((index, node) => node.nodeType === 8)
    .map((index, node) => node.data)
    .get();
  } catch (error) {
    logger.error(error.stack);
  } finally {
    let str = comments.toString();
    str = str.replace(/\\n/g, "");
    // assert(str != "");
    const regex = str.match(commentRegex);
    if (regex == null) {
      logger.error("regex is NULL");
      return false;
    }
    return regex;
  }
}

export async function idMisMatchCheck(blogIdArrOfObj) {
  const blogIds = blogIdArrOfObj.map(obj => obj.id);
  const query = "select blog_id, naver_id from mail_id_mismatch where"
    + " blog_id in (?)";
  try {
    const rows = await executeQuery(query, [blogIds]);
    console.log("doSearchService.js:356 / rows: ", rows);

    const mismatchMap = rows.reduce((acc, row) => {
      acc[row.blog_id] = row.naver_id;
      return acc;
    }, {});

    console.log("doSearchService.js:363 / mismatchMap: ", mismatchMap);

    const updatedBlogInfo = blogIdArrOfObj.map(obj => {
      if (mismatchMap.hasOwnProperty(obj.id)) {
        console.log(
          `ID mismatch found. Blog ID: ${obj.id}, Naver ID: ${mismatchMap[obj.id]}`);
        return { ...obj, id: mismatchMap[obj.id] };
      } else {
        return obj;
      }
    });

    return updatedBlogInfo;

  } catch (e) {
    console.error(e);
    logger.error(e);
  }
}

function convertUTCtoKST(utcString) {
  const utcMilliseconds = parseInt(utcString) * 1000;
  const date = new Date(utcMilliseconds);

  // yyyy-mm-dd hh:mm:ss 형식으로 반환
  return date.toISOString().replace("T", " ").split(".")[0];
}
