# rena-client (N 메일 발송UI)

# 실행 방법

### Docker 설치

Windows:
[Docker download](https://www.docker.com/products/docker-desktop/)

Linux:

```shell
sudo apt install -y docker.io
```

### renamailer 이미지 다운로드 (도커는 백그라운드로 실행중이어 함)

```shell
docker pull ghcr.io/bis0908/renamailer:latest
```

### 실행

```shell
docker run -p 외부포트입력:3000 -d --name renamailer ghcr.io/bis0908/renamailer:latest
```

```
renamailer
|-app.js
|-babel.config.cjs
|-client
|-config
| |-dbConfig.js
| |-logger.js
|-Dockerfile
|-ecosystem.config.cjs
|-goorm.manifest
|-jest.config.mjs
|-models
| |-authService.js
| |-doSearchService.js
| |-hiworksService.js
| |-mailService copy.js
| |-mailService.js
| |-queryService.js
|-nodemon.json
|-package-lock.json
|-package.json
|-public
| |-js
| | |-dataTables.js
| | |-index.js
| | |-indexFunctions.js
| | |-login.js
| | |-mail-delivery-common.js
| | |-mail-delivery-group-state.js
| | |-mail-delivery-schedule-v2.js
| | |-mail-delivery-schedule.js
| | |-test.js
| |-stylesheets
| | |-login.css
| | |-modules
| | | |-classStyle.css
| | | |-idStyle.css
| | | |-tagStyle.css
| | |-style.css
|-readme.md
|-routes
| |-authRouter.js
| |-crawlRouter.js
| |-dbRouter.js
| |-mailRouter.js
| |-vendorsRouter.js
|-test
| |-test.js
|-views
| |-index.ejs
| |-login.ejs
| |-mail-delivery-group-state.ejs
| |-mail-delivery-schedule-v2.ejs
| |-mail-delivery-schedule.ejs
| |-send-email.ejs
| |-target-search.ejs
| |-vendors.ejs
|-webpack.config.mjs

```
