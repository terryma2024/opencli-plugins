import { execSync } from 'child_process';

interface Flight {
  airline: string;
  flightNo: string;
  depTime: string;
  arrTime: string;
  price: string;
  cabin: string;
}

const cityMap: Record<string, string> = {
  '哈尔滨': 'hrb',
  '上海': 'sha',
  '北京': 'bjs',
  '广州': 'can',
  '深圳': 'szx',
  '成都': 'ctu',
  '杭州': 'hgh',
  '武汉': 'wuh',
  '西安': 'siy',
  '重庆': 'ckg',
  '青岛': 'tao',
  '厦门': 'xmn',
  '长沙': 'csx',
  '南京': 'nkg',
  '苏州': 'szv',
  '郑州': 'cgo',
  '济南': 'tna',
  '合肥': 'hfe',
  '福州': 'foc',
  '海口': 'hak',
  '三亚': 'syx',
  '昆明': 'kmg',
  '贵阳': 'kwe',
  '南宁': 'nng',
  '南昌': 'khn',
  '太原': 'tyn',
  '石家庄': 'sjw',
  '沈阳': 'she',
  '长春': 'cgq',
  '大连': 'dlc',
  '乌鲁木齐': 'urc',
  '兰州': 'lhw',
  '西宁': 'xnn',
  '银川': 'inc',
  '呼和浩特': 'het',
  '拉萨': 'lxa'
};

export default async function query(dep: string, arr: string, date: string) {
  if (!dep || !arr || !date) {
    console.log('使用方法: opencli ctrip-flights query --dep <出发地> --arr <目的地> --date <日期>');
    console.log('支持中文城市名或三位IATA机场编码（例如：PEK=北京，SHA=上海，CAN=广州）');
    console.log('示例: opencli ctrip-flights query --dep 哈尔滨 --arr 上海 --date 2026-05-06');
    console.log('示例: opencli ctrip-flights query --dep PEK --arr CAN --date 2026-06-01');
    process.exit(1);
  }

  const depCode = cityMap[dep] || dep.toLowerCase();
  const arrCode = cityMap[arr] || arr.toLowerCase();
  const url = `https://flights.ctrip.com/online/list/oneway-${depCode}-${arrCode}?depdate=${date}`;

  console.log(`正在查询 ${dep} → ${arr} ${date} 的航班信息...`);

  try {
    execSync('opencli browser close', { stdio: 'ignore' });
    execSync(`opencli browser open "${url}"`);
    execSync('opencli browser wait time 10');
    
    const result = execSync(`opencli browser eval "(() => {
        const flights = [];
        const text = document.body.innerText;
        const lines = text.split('\\\\n').map(l => l.trim()).filter(l => l);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^[\\u4e00-\\u9fa5]+航空$/.test(line) && i < lines.length - 6) {
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
                        
                        const priceMatch = lines[j].match(/^¥(\\d+)起?$/);
                        if (priceMatch && !price) {
                            price = '¥' + priceMatch[1];
                            if (j + 1 < lines.length && /舱/.test(lines[j+1])) {
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
    })()"`, { encoding: 'utf8' });
    
    execSync('opencli browser close', { stdio: 'ignore' });
    
    const flights: Flight[] = JSON.parse(result.trim());
    
    if (!flights || flights.length === 0) {
      console.log('❌ 未查询到符合条件的航班信息');
      console.log('💡 若您输入的是中文城市名可能无法识别，建议直接使用三位IATA机场编码');
      console.log('   例如：PEK(北京)、SHA(上海虹桥)、PVG(上海浦东)、CAN(广州)、CTU(成都)等');
      return;
    }
    
    console.log(`\n✅ 查询到 ${flights.length} 个航班：\n`);
    console.log('航空公司\t航班号\t\t起飞时间\t到达时间\t价格\t舱位');
    console.log('----------------------------------------------------------------------------------------');
    flights.forEach(f => {
      console.log(`${f.airline}\t${f.flightNo}\t${f.depTime}\t\t${f.arrTime}\t\t${f.price}\t${f.cabin || ''}`);
    });
    
    const minPrice = Math.min(...flights.map(f => parseInt(f.price.replace('¥', ''))));
    console.log(`\n💡 最低价格：¥${minPrice}`);
    
  } catch (e: any) {
    console.error('❌ 查询失败:', e.stderr?.toString() || e.message);
    execSync('opencli browser close', { stdio: 'ignore' });
    process.exit(1);
  }
}
