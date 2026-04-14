import { execSync } from 'child_process';

const cityMap = {
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

export default async function query(options) {
  const { dep, arr, date } = options;
  
  if (!dep || !arr || !date) {
    console.log('使用方法: opencli ctrip-flights query --dep <出发地> --arr <目的地> --date <日期>');
    console.log('支持中文城市名或三位IATA机场编码（例如：PEK=北京，SHA=上海，CAN=广州）');
    console.log('示例: opencli ctrip-flights query --dep 哈尔滨 --arr 上海 --date 2026-05-01');
    console.log('示例: opencli ctrip-flights query --dep PEK --arr CAN --date 2026-06-01');
    throw new Error('Missing required parameters');
  }

  const depCode = cityMap[dep] || dep.toLowerCase();
  const arrCode = cityMap[arr] || arr.toLowerCase();
  const url = `https://flights.ctrip.com/online/list/oneway-${depCode}-${arrCode}?depdate=${date}`;

  console.log(`正在查询 ${dep} → ${arr} ${date} 的航班信息...`);

  try {
    execSync('opencli browser close', { stdio: 'ignore' });
    execSync(`opencli browser open "${url}"`);
    console.log(`⌛ 等待页面加载...`);
    execSync('opencli browser wait time 15'); // 延长等待时间到15秒，确保航班列表加载完成
    
    // 先输出页面标题和部分内容，调试用
    const pageTitle = execSync(`opencli browser eval "document.title"`, { encoding: 'utf8' }).trim();
    console.log(`📄 页面标题: ${pageTitle}`);
    
    const pageContentPreview = execSync(`opencli browser eval "document.body.innerText.slice(0, 2000)"`, { encoding: 'utf8' }).trim();
    console.log(`\n🔍 页面内容预览（前2000字符）:\n${pageContentPreview}\n`);
    
    const result = execSync(`opencli browser eval "(() => {
      const flights = [];
      const text = document.body.innerText;
      const lines = text.split('\\\\n').map(l => l.trim()).filter(l => l);
      
      let currentFlight = null;
      let state = 'lookForAirline'; // 状态机：找航空公司 -> 找航班号 -> 找起飞时间 -> 找到达时间 -> 找价格 -> 找舱位
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (state === 'lookForAirline') {
          // 匹配航空公司：以航空、航司结尾的中文
          if (/.*(航空|航司|航空股份|航空集团)$/.test(line) && line.length < 10) {
            currentFlight = {
              airline: line,
              flightNo: null,
              depTime: null,
              arrTime: null,
              price: null,
              cabin: null
            };
            state = 'lookForFlightNo';
          }
        } else if (state === 'lookForFlightNo') {
          // 匹配航班号：2个大写字母 + 数字
          const flightNoMatch = line.match(/^([A-Z]{2}[0-9]+)/);
          if (flightNoMatch) {
            currentFlight.flightNo = flightNoMatch[1];
            state = 'lookForDepTime';
          } else if (/.*(航空|航司)$/.test(line)) {
            // 遇到下一个航空公司，丢弃当前不完整的
            currentFlight = {
              airline: line,
              flightNo: null,
              depTime: null,
              arrTime: null,
              price: null,
              cabin: null
            };
            state = 'lookForFlightNo';
          }
        } else if (state === 'lookForDepTime') {
          // 匹配起飞时间：HH:MM格式
          const timeMatch = line.match(/^([0-2][0-9]):([0-5][0-9])$/);
          if (timeMatch) {
            currentFlight.depTime = line;
            state = 'lookForArrTime';
          }
        } else if (state === 'lookForArrTime') {
          // 匹配到达时间：HH:MM格式，可能带+1天
          const timeMatch = line.match(/^([0-2][0-9]):([0-5][0-9])(\\+1天)?$/);
          if (timeMatch) {
            currentFlight.arrTime = line;
            state = 'lookForPrice';
          }
        } else if (state === 'lookForPrice') {
          // 匹配价格：¥开头，后面数字
          const priceMatch = line.match(/^¥(\\d+)起?$/);
          if (priceMatch) {
            currentFlight.price = '¥' + priceMatch[1];
            state = 'lookForCabin';
          }
        } else if (state === 'lookForCabin') {
          // 匹配舱位：包含经济舱、公务舱、头等舱、商务舱等关键词
          if (/.*(经济舱|公务舱|头等舱|商务舱|超级经济舱|折扣经济舱)/.test(line)) {
            currentFlight.cabin = line;
            // 完成一个航班的解析
            if (currentFlight.airline && currentFlight.flightNo && currentFlight.depTime && currentFlight.arrTime && currentFlight.price) {
              flights.push({...currentFlight});
            }
            // 重置状态，找下一个航班
            currentFlight = null;
            state = 'lookForAirline';
          }
        }
      }
      
      return JSON.stringify(flights.slice(0, 10));
    })()"`, { encoding: 'utf8' });
    
    execSync('opencli browser close', { stdio: 'ignore' });
    
    console.log(`🔍 原始返回结果: ${result.trim()}`);
    const flights = JSON.parse(result.trim());
    
    if (!flights || flights.length === 0) {
      console.log('❌ 未查询到符合条件的航班信息');
      console.log('💡 可能的原因：');
      console.log('   1. 输入的日期是过去的日期，请使用未来的日期查询');
      console.log('   2. 中文城市名无法识别，建议直接使用三位IATA机场编码');
      console.log('   3. 当前航线无可用航班');
      console.log('   示例：PEK(北京)、SHA(上海虹桥)、PVG(上海浦东)、CAN(广州)、CTU(成都)等');
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
    
  } catch (e) {
    console.error('❌ 查询失败:', e.stderr?.toString() || e.message);
    try {
      execSync('opencli browser close', { stdio: 'ignore' });
    } catch (closeErr) {}
    throw new Error(`Query failed: ${e.stderr?.toString() || e.message}`);
  }
}
