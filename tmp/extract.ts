import https from "node:https";
import fs from "node:fs";

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

async function extract(pathStr: string) {
  try {
    const raw = await fetchUrl(`https://8328-io7hoav8lviopy3gxhv6f-0a9ff7ad.us1.manus.computer${pathStr}`);
    const match = raw.match(/\/\/# sourceMappingURL=data:application\/json;base64,(.*)$/m);
    if (match && match[1]) {
      const json = JSON.parse(Buffer.from(match[1], "base64").toString("utf-8"));
      return { sources: json.sources, content: json.sourcesContent?.[0] };
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function run() {
  const home = await extract("/src/pages/Home.tsx");
  if (home && home.content) {
    fs.writeFileSync("extracted_Home.tsx", home.content);
    console.log("Saved extracted_Home.tsx, length:", home.content.length);
  }
}
run();
