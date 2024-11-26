// 한글 유니코드 범위
const HANGUL_UNICODE_RANGE = {
  start: 0xac00,
  end: 0xd7af,
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAlphaNumeric() {
  let ret = "";
  const rand = getRandomInt(5, 10);
  for (let i = 1; i <= rand; i++) {
    const v = getRandomInt(1, 100);
    if (v <= 40) {
      ret += String.fromCharCode(getRandomInt(97, 122)); // a-z
    } else if (v <= 80) {
      ret += String.fromCharCode(getRandomInt(65, 90)); // A-Z
    } else if (v <= 90) {
      ret += String.fromCharCode(getRandomInt(48, 57)); // 0-9
    } else {
      ret += String.fromCharCode(
        getRandomInt(HANGUL_UNICODE_RANGE.start, HANGUL_UNICODE_RANGE.end)
      ); // 한글
    }
  }
  return ret;
}

function randomKeyValue() {
  let ret = "&";
  for (let i = 0; i < getRandomInt(1, 3); i++) {
    const V = randomAlphaNumeric();
    const P = randomAlphaNumeric();
    ret += (i >= 1 ? "&" : "") + V + "=" + P;
  }
  return ret;
}
// console.log("randomKeyValue(): ", randomKeyValue());

function addRandomUrlQueryString(url) {
  const urlParts = url.split("campaign_no=");
  let newUrl = urlParts[0] + randomKeyValue() + "&campaign_no=" + urlParts[1];
  newUrl = newUrl.replace(/" target/, randomKeyValue() + '" target');
  return newUrl;
}

const url = `<a href="https://reviewnavi.co.kr/campaign_detail.php?campaign_no=312" target="_blank">링크</a>`;
console.log("add_random_url(url): ", addRandomUrlQueryString(url));
