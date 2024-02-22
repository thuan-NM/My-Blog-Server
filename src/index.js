const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const postsRouter = require("./routes/posts");
const authRouter = require("./routes/auth")
const usersRouter = require("./routes/users")
const companyAuthRouter = require("./routes/companyAuth")
const companiesRouter = require("./routes/companies")
const commentsRoute = require("./routes/comments");
const reactsRouter =require("./routes/reacts")
const { connectDb } = require("./utils/connectDb");


const app = express();
const port = 3001;
app.use(cors());
app.use(bodyParser.json());

app.use("/posts", postsRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/companyauth", companyAuthRouter)
app.use("/companies",companiesRouter)
app.use("/comments",commentsRoute);
app.use("/reactions", reactsRouter )

app.listen(port, () => {
    console.log(`Listenning on port ${port}`);
    connectDb();
});