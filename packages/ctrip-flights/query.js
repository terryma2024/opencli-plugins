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
    execSync('opencli browser wait time 10');
    
    // 先输出页面标题和部分内容，调试用
    const pageTitle = execSync(`opencli browser eval "document.title"`, { encoding: 'utf8' }).trim();
    console.log(`📄 页面标题: ${pageTitle}`);
    
    const pageContentPreview = execSync(`opencli browser eval "document.body.innerText.slice(0, 2000)"`, { encoding: 'utf8' }).trim();
    console.log(`\n🔍 页面内容预览（前2000字符）:\n${pageContentPreview}\n`);
    
    const result = execSync(`opencli browser eval "(() => {
      const flights = [];
      // 尝试用新的选择器匹配携程最新的航班列表结构
      const flightItems = document.querySelectorAll('.flight-item, .flight-list-item, [class*=flight-card]');
      console.log('找到航班元素数量:', flightItems.length);
      
      if (flightItems.length > 0) {
        flightItems.forEach(item => {
          try {
            const airline = item.querySelector('[class*=airline-name]')?.innerText?.trim();
            const flightNo = item.querySelector('[class*=flight-no]')?.innerText?.trim();
            const depTime = item.querySelector('[class*=dep-time]')?.innerText?.trim();
            const arrTime = item.querySelector('[class*=arr-time]')?.innerText?.trim();
            const price = item.querySelector('[class*=price]')?.innerText?.trim();
            const cabin = item.querySelector('[class*=cabin]')?.innerText?.trim();
            
            if (airline && flightNo && depTime && arrTime && price) {
              flights.push({ airline, flightNo, depTime, arrTime, price, cabin });
            }
          } catch (e) {
            console.log('解析航班项失败:', e);
          }
        });
      }
      
      // 如果用选择器没找到，再尝试用文本匹配的方式
      if (flights.length === 0) {
        const text = document.body.innerText;
        const lines = text.split('\\\\n');
        let currentFlight = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const flightMatch = line.match(/([\\\\u4e00-\\\\u9fa5]+航空)\\\\s+([A-Z0-9]+)\\\\s+(.*?)\\\\s+(\\\\d{2}:\\\\d{2})\\\\s+(.*?)\\\\s+(\\\\d{2}:\\\\d{2})\\\\s+(.*)/);
          if (flightMatch) {
            if (currentFlight) flights.push(currentFlight);
            currentFlight = {
              airline: flightMatch[1],
              flightNo: flightMatch[2],
              depTime: flightMatch[4],
              arrTime: flightMatch[6],
              price: null,
              cabin: null,
            };
          }
          
          const priceMatch = line.match(/¥\\\\s*(\\\\d+)起?\\\\s*(.*)/);
          if (priceMatch && currentFlight && !currentFlight.price) {
            currentFlight.price = '¥' + priceMatch[1];
            currentFlight.cabin = priceMatch[2] || '';
          }
        }
        
        if (currentFlight) flights.push(currentFlight);
      }
      
      return JSON.stringify(flights.filter(f => f.flightNo && f.price).slice(0, 10));
    })()"`, { encoding: 'utf8' });
    
    execSync('opencli browser close', { stdio: 'ignore' });
    
    console.log(`🔍 原始返回结果: ${result.trim()}`);
    const flights = JSON.parse(result.trim());
    
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
    
  } catch (e) {
    console.error('❌ 查询失败:', e.stderr?.toString() || e.message);
    execSync('opencli browser close', { stdio: 'ignore' });
    throw new Error(`Query failed: ${e.stderr?.toString() || e.message}`);
  }
}
