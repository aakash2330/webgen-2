import https from "https";
import fs from "fs";

const url = process.argv[2];

if (!url) {
  console.error("❌ Usage: node download.js <presigned_url>");
  process.exit(1);
}

const filename = url.split("/").pop()?.split("?")[0] || "downloaded-file";
const output = `./${filename}`;

https
  .get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`❌ Failed with status code: ${res.statusMessage}`);
      res.resume();
      return;
    }

    const file = fs.createWriteStream(output);
    res.pipe(file);

    file.on("finish", () => {
      file.close(() => console.log(`✅ Download complete: ${output}`));
    });
  })
  .on("error", (err) => {
    console.error("❌ Error:", err.message);
  });
