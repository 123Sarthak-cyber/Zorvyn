import app from "./app.js";
import { initDatabase } from "./db/database.js";

const PORT = process.env.PORT || 4000;

initDatabase();

app.listen(PORT, () => {
  // Keep startup log explicit for quick local verification.
  console.log(`Finance backend running on http://localhost:${PORT}`);
});
