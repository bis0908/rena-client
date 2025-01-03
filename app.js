import { authRouter } from "./routes/authRouter.js";
import { crawlingRouter } from "./routes/crawlRouter.js";
import cryptoRandomString from "crypto-random-string";
import { errorHandler } from "./config/error_handler.js";
import express from "express";
import initSocketIO from "./models/socketService.js";
import logger from "./config/logger.js";
import { mailRouter } from "./routes/mailRouter.js";
import moment from "moment-timezone";
import { pool } from "./config/dbConfig.js";
import { queryRouter } from "./routes/dbRouter.js";
import session from "express-session";
import { vendorsRouter } from "./routes/vendorsRouter.js";

// import path from "path";

const app = express();
const PORT = 3000;
// const __dirname = path.resolve(); // for ES module

moment.tz.setDefault("Asia/Seoul");

app.use(
  express.urlencoded({
    extended: true,
    limit: "400mb",
  })
);

// session
app.use(
  session({
    secret: cryptoRandomString({ length: 48, type: "base64" }),
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true },
  })
);

app.use(express.static("public"));
app.use(express.static("dist"));
app.use(
  express.json({
    limit: "400mb",
  })
);

// template engine
app.set("view engine", "ejs");

// error handler
app.use(errorHandler);

// routes
app.use("/vendors", vendorsRouter);
app.use("/crawling", crawlingRouter);
app.use("/db", queryRouter);
app.use("/mail", mailRouter);
app.use("/auth", authRouter);

// connect to socket.io
const server = app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
initSocketIO(server);

app.get("/login", function (req, res) {
  res.render("login");
});

function checkAuthenticated(req, res, next) {
  if (req.session.loggedin) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.get("/", checkAuthenticated, (req, res) => {
  try {
    res.render("index");
    // console.log("loading index.ejs");
  } catch (e) {
    console.log(e.message);
    logger.error(e.message);
  }
});

app.get("/mail-delivery-schedule", checkAuthenticated, (req, res) => {
  try {
    res.render("mail-delivery-schedule");
  } catch (e) {
    console.log(e.message);
    logger.error(e.message);
  }
});

app.get("/mail-delivery-group-state", checkAuthenticated, (req, res) => {
  try {
    res.render("mail-delivery-group-state");
  } catch (e) {
    console.log(e.message);
    logger.error(e.message);
  }
});

app.get("/mail-delivery-schedule-v2", checkAuthenticated, (req, res) => {
  try {
    res.render("mail-delivery-schedule-v2");
  } catch (e) {
    console.log(e.message);
    logger.error(e.message);
  }
});

app.post("/api/mail_server_status", async (req, res) => {
  try {
    const [rows, fields] = await pool.query("SELECT * FROM mail_server_status");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.post("/logout", async (req, res) => {
  try {
    if (req.session.loggedin) {
      req.session.destroy(function (err) {
        if (err) {
          throw err;
        }
        res.redirect("/");
      });
    }
  } catch (error) {}
});
