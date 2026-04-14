# opencli-plugin-ctrip-flights

OpenCLI plugin for querying domestic flight information from Ctrip (携程).

## Features

- 🔍 Real-time flight data from Ctrip official website
- 🏙️ Supports 30+ major Chinese cities, auto-maps Chinese names to airport codes
- 📊 Returns structured information: airline, flight number, departure/arrival time, price, cabin class
- 💰 Auto-calculates the lowest price for the route
- 🔑 No extra API key required, uses OpenCLI browser automation capability

## Installation

```bash
opencli plugin install github:terryma2024/opencli-plugins/packages/ctrip-flights
```

## Usage

```bash
# Query flights from 哈尔滨 to 上海 on 2026-05-06
opencli ctrip-flights query --dep 哈尔滨 --arr 上海 --date 2026-05-06

# Short form
opencli ctrip-flights query -d 北京 -a 广州 --date 2026-06-01
```

## Example Output

```
正在查询 哈尔滨 → 上海 2026-05-06 的航班信息...

✅ 查询到 5 个航班：

航空公司	航班号		起飞时间	到达时间	价格	舱位
----------------------------------------------------------------------------------------
东方航空	MU5612	20:00		23:15		¥880	经济舱2.8折
厦门航空	MF3922	20:00		23:15		¥890	经济舱2.9折
东方航空	MU6562	19:10		22:20		¥980	经济舱3.1折
厦门航空	MF3924	19:10		22:20		¥990	经济舱3.2折
厦门航空	MF8555	07:40		11:10		¥1000	经济舱3.2折

💡 最低价格：¥880
```

## Requirements

- OpenCLI >= 1.7.3
- OpenCLI Browser Bridge extension installed (for browser automation)

## License

MIT
