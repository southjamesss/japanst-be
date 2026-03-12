require("dotenv").config();

const app = require("./app");

const port = Number.parseInt(process.env.PORT || "3000", 10);

if (Number.isNaN(port)) {
  throw new Error("PORT must be a valid number");
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
