import express from "express";
import path from "path";

export const vendorsRouter = express.Router();
const __dirname = path.resolve(); // for ES module

vendorsRouter.use(
  "/bootstrap",
  express.static(path.join(__dirname, "/node_modules/bootstrap/dist"))
);

vendorsRouter.use(
  "/bootstrap-icons",
  express.static(path.join(__dirname, "/node_modules/bootstrap-icons/font"))
);

vendorsRouter.use(
  "/jquery",
  express.static(path.join(__dirname, "/node_modules/jquery/dist"))
);

vendorsRouter.use(
  "/jqueryui",
  express.static(path.join(__dirname, "/node_modules/jqueryui"))
);

vendorsRouter.use(
  "/popperjs",
  express.static(path.join(__dirname, "/node_modules/@popperjs/core/dist"))
);

vendorsRouter.use(
  "/quill",
  express.static(path.join(__dirname, "/node_modules/quill/dist"))
);

vendorsRouter.use(
  "/html2canvas",
  express.static(path.join(__dirname, "/node_modules/html2canvas/dist"))
);

vendorsRouter.use(
  "/datatables",
  express.static(path.join(__dirname, "/node_modules/datatables.net/js"))
);

vendorsRouter.use(
  "/datatables-bs5",
  express.static(path.join(__dirname, "/node_modules/datatables.net-bs5"))
);

vendorsRouter.use(
  "/socket.io",
  express.static(path.join(__dirname, "/node_modules/socket.io/client-dist"))
);
