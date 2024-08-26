const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require('http');
const { connectDb } = require("./utils/connectDb");
const wss = require("./routes/message");

const postsRouter = require("./routes/posts");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const companyAuthRouter = require("./routes/companyAuth");
const companiesRouter = require("./routes/companies");
const commentsRoute = require("./routes/comments");
const reactsRouter = require("./routes/reacts");
const overviewsRoute = require("./routes/overviews");
const experiencesRoute = require("./routes/experiences");
const educationsRoute = require("./routes/educations");
const jobstatusRoute = require("./routes/jobstatus");
const followRouter = require("./routes/follow");

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

app.use("/posts", postsRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/companyauth", companyAuthRouter);
app.use("/companies", companiesRouter);
app.use("/comments", commentsRoute);
app.use("/reactions", reactsRouter);
app.use("/overviews", overviewsRoute);
app.use("/experiences", experiencesRoute);
app.use("/educations", educationsRoute);
app.use("/jobstatus", jobstatusRoute);
app.use("/follow", followRouter);

const server = http.createServer(app);
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    connectDb();
});

server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", (ws), request);
    });
});
