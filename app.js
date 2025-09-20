var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
// var trustSetRouter = require("./src/routes/trustSetRoutes"); // 개발자 1 담당 - 레거시로 이동
var authRouter = require("./src/routes/authRoutes");
var keyRouter = require("./src/routes/keyRoutes");
var cashoutRouter = require("./src/routes/cashoutRoutes");
const AuthMiddleware = require("./src/middleware/authMiddleware");

var app = express();
const authMiddleware = new AuthMiddleware();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// 보안 미들웨어 적용
app.use(authMiddleware.securityHeaders());
app.use(authMiddleware.corsConfig());
app.use(authMiddleware.requestLogger());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// 세션 관리 미들웨어
app.use(authMiddleware.sessionManager());

app.use("/", indexRouter);
app.use("/users", usersRouter);
// app.use("/api/trustset", trustSetRouter); // 개발자 1 담당 - 레거시로 이동
app.use("/api/auth", authRouter);
app.use("/api/keys", keyRouter);
app.use("/api/cashout", cashoutRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// 보안 에러 핸들러
app.use(authMiddleware.errorHandler());

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
