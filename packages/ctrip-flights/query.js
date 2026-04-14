import { execSync } from "child_process";
const cityMap = {
  "\u54C8\u5C14\u6EE8": "hrb",
  "\u4E0A\u6D77": "sha",
  "\u5317\u4EAC": "bjs",
  "\u5E7F\u5DDE": "can",
  "\u6DF1\u5733": "szx",
  "\u6210\u90FD": "ctu",
  "\u676D\u5DDE": "hgh",
  "\u6B66\u6C49": "wuh",
  "\u897F\u5B89": "siy",
  "\u91CD\u5E86": "ckg",
  "\u9752\u5C9B": "tao",
  "\u53A6\u95E8": "xmn",
  "\u957F\u6C99": "csx",
  "\u5357\u4EAC": "nkg",
  "\u82CF\u5DDE": "szv",
  "\u90D1\u5DDE": "cgo",
  "\u6D4E\u5357": "tna",
  "\u5408\u80A5": "hfe",
  "\u798F\u5DDE": "foc",
  "\u6D77\u53E3": "hak",
  "\u4E09\u4E9A": "syx",
  "\u6606\u660E": "kmg",
  "\u8D35\u9633": "kwe",
  "\u5357\u5B81": "nng",
  "\u5357\u660C": "khn",
  "\u592A\u539F": "tyn",
  "\u77F3\u5BB6\u5E84": "sjw",
  "\u6C88\u9633": "she",
  "\u957F\u6625": "cgq",
  "\u5927\u8FDE": "dlc",
  "\u4E4C\u9C81\u6728\u9F50": "urc",
  "\u5170\u5DDE": "lhw",
  "\u897F\u5B81": "xnn",
  "\u94F6\u5DDD": "inc",
  "\u547C\u548C\u6D69\u7279": "het",
  "\u62C9\u8428": "lxa"
};
async function query(dep, arr, date) {
  if (!dep || !arr || !date) {
    console.log("\u4F7F\u7528\u65B9\u6CD5: opencli ctrip-flights query --dep <\u51FA\u53D1\u5730> --arr <\u76EE\u7684\u5730> --date <\u65E5\u671F>");
    console.log("\u793A\u4F8B: opencli ctrip-flights query --dep \u54C8\u5C14\u6EE8 --arr \u4E0A\u6D77 --date 2026-05-06");
    process.exit(1);
  }
  const depCode = cityMap[dep] || dep.toLowerCase();
  const arrCode = cityMap[arr] || arr.toLowerCase();
  const url = `https://flights.ctrip.com/online/list/oneway-${depCode}-${arrCode}?depdate=${date}`;
  console.log(`\u6B63\u5728\u67E5\u8BE2 ${dep} \u2192 ${arr} ${date} \u7684\u822A\u73ED\u4FE1\u606F...`);
  try {
    execSync("opencli browser close", { stdio: "ignore" });
    execSync(`opencli browser open "${url}"`);
    execSync("opencli browser wait time 10");
    const result = execSync(`opencli browser eval "(() => {
        const flights = [];
        const text = document.body.innerText;
        const lines = text.split('\\\\n').map(l => l.trim()).filter(l => l);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^[\\u4e00-\\u9fa5]+\u822A\u7A7A$/.test(line) && i < lines.length - 6) {
                let nextLine = lines[i+1];
                const flightNoMatch = nextLine.match(/^([A-Z]{2}[0-9]+)/);
                if (flightNoMatch) {
                    const airline = line;
                    const flightNo = flightNoMatch[1];
                    
                    let depTime = null;
                    let arrTime = null;
                    let price = null;
                    let cabin = null;
                    
                    for (let j = i + 2; j < i + 10 && j < lines.length; j++) {
                        const timeMatch = lines[j].match(/^\\d{2}:\\d{2}$/);
                        if (timeMatch && !depTime) {
                            depTime = timeMatch[0];
                        } else if (timeMatch && depTime && !arrTime) {
                            arrTime = timeMatch[0];
                        }
                        
                        const priceMatch = lines[j].match(/^\xA5(\\d+)\u8D77?$/);
                        if (priceMatch && !price) {
                            price = '\xA5' + priceMatch[1];
                            if (j + 1 < lines.length && /\u8231/.test(lines[j+1])) {
                                cabin = lines[j+1];
                            }
                            break;
                        }
                    }
                    
                    if (airline && flightNo && depTime && arrTime && price) {
                        flights.push({ airline, flightNo, depTime, arrTime, price, cabin: cabin || '' });
                        if (flights.length >= 10) break;
                    }
                }
            }
        }
        
        return JSON.stringify(flights);
    })()"`, { encoding: "utf8" });
    execSync("opencli browser close", { stdio: "ignore" });
    const flights = JSON.parse(result.trim());
    if (!flights || flights.length === 0) {
      console.log("\u672A\u67E5\u8BE2\u5230\u7B26\u5408\u6761\u4EF6\u7684\u822A\u73ED\u4FE1\u606F");
      return;
    }
    console.log(`
\u2705 \u67E5\u8BE2\u5230 ${flights.length} \u4E2A\u822A\u73ED\uFF1A
`);
    console.log("\u822A\u7A7A\u516C\u53F8	\u822A\u73ED\u53F7		\u8D77\u98DE\u65F6\u95F4	\u5230\u8FBE\u65F6\u95F4	\u4EF7\u683C	\u8231\u4F4D");
    console.log("----------------------------------------------------------------------------------------");
    flights.forEach((f) => {
      console.log(`${f.airline}	${f.flightNo}	${f.depTime}		${f.arrTime}		${f.price}	${f.cabin || ""}`);
    });
    const minPrice = Math.min(...flights.map((f) => parseInt(f.price.replace("\xA5", ""))));
    console.log(`
\u{1F4A1} \u6700\u4F4E\u4EF7\u683C\uFF1A\xA5${minPrice}`);
  } catch (e) {
    console.error("\u274C \u67E5\u8BE2\u5931\u8D25:", e.stderr?.toString() || e.message);
    execSync("opencli browser close", { stdio: "ignore" });
    process.exit(1);
  }
}
export {
  query as default
};
