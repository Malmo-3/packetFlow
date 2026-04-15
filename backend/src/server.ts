import dotenv from "dotenv";
import app from "./app";
import connectDB from "./config/db";
import testRoute from "./routes/test.route";

dotenv.config();

const PORT = 3001;

connectDB();


app.use(testRoute);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});