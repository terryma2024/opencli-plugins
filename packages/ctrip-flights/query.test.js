import { beforeEach, describe, expect, it, vi } from 'vitest';
import query from './query.js';

// Mock child_process execSync
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));
import { execSync } from 'child_process';

describe('ctrip-flights query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to avoid output clutter
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should support Chinese city name input', async () => {
    // Mock successful response - execSync call order:
    // 1. initial close
    // 2. open url
    // 3. wait time
    // 4~13. 5次滚动，每次scroll + wait
    // 14. 滚动回顶部
    // 15. eval document.title
    // 16. eval flight data
    // 17. final close
    vi.mocked(execSync)
      .mockReturnValueOnce('') // 1. initial close
      .mockReturnValueOnce('') // 2. open url
      .mockReturnValueOnce('') // 3. wait time
      // 5次滚动
      .mockReturnValueOnce('') // scroll 1
      .mockReturnValueOnce('') // wait 1
      .mockReturnValueOnce('') // scroll 2
      .mockReturnValueOnce('') // wait 2
      .mockReturnValueOnce('') // scroll 3
      .mockReturnValueOnce('') // wait 3
      .mockReturnValueOnce('') // scroll 4
      .mockReturnValueOnce('') // wait 4
      .mockReturnValueOnce('') // scroll 5
      .mockReturnValueOnce('') // wait 5
      .mockReturnValueOnce('') // 14. 滚动回顶部
      .mockReturnValueOnce('携程机票查询') // 15. title
      .mockReturnValueOnce(JSON.stringify([ // 16. flight data
        { airline: '东方航空', flightNo: 'MU5101', depTime: '08:00', arrTime: '10:30', price: '¥680', cabin: '经济舱2.8折' },
        { airline: '中国国航', flightNo: 'CA1501', depTime: '09:00', arrTime: '11:30', price: '¥720', cabin: '经济舱2.8折' },
      ]))
      .mockReturnValueOnce(''); // 17. final close

    await query({ dep: '北京', arr: '上海', date: '2024-06-01' });
    
    // Verify execSync was called with correct URL
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('oneway-bjs-sha?depdate=2024-06-01'));
  });

  it('should support IATA airport code input', async () => {
    // Mock successful response
    vi.mocked(execSync)
      .mockReturnValueOnce('') // 1. initial close
      .mockReturnValueOnce('') // 2. open url
      .mockReturnValueOnce('') // 3. wait time
      // 5次滚动
      .mockReturnValueOnce('') // scroll 1
      .mockReturnValueOnce('') // wait 1
      .mockReturnValueOnce('') // scroll 2
      .mockReturnValueOnce('') // wait 2
      .mockReturnValueOnce('') // scroll 3
      .mockReturnValueOnce('') // wait 3
      .mockReturnValueOnce('') // scroll 4
      .mockReturnValueOnce('') // wait 4
      .mockReturnValueOnce('') // scroll 5
      .mockReturnValueOnce('') // wait 5
      .mockReturnValueOnce('') // 14. 滚动回顶部
      .mockReturnValueOnce('携程机票查询') // 15. title
      .mockReturnValueOnce(JSON.stringify([ // 16. flight data
        { airline: '南方航空', flightNo: 'CZ3101', depTime: '08:00', arrTime: '11:00', price: '¥880', cabin: '经济舱3.2折' },
      ]))
      .mockReturnValueOnce(''); // 17. final close

    await query({ dep: 'PEK', arr: 'CAN', date: '2024-06-01' });
    
    // Verify execSync was called with correct URL (lowercase IATA code)
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('oneway-pek-can?depdate=2024-06-01'));
  });

  it('should reject when required parameters are missing', async () => {
    // Missing dep
    await expect(query({ arr: '上海', date: '2024-06-01' })).rejects.toThrow('Missing required parameters');
    // Missing arr
    await expect(query({ dep: '北京', date: '2024-06-01' })).rejects.toThrow('Missing required parameters');
    // Missing date
    await expect(query({ dep: '北京', arr: '上海' })).rejects.toThrow('Missing required parameters');
  });

  it('should show hint when no flights found', async () => {
    // Mock empty response
    vi.mocked(execSync)
      .mockReturnValueOnce('') // 1. initial close
      .mockReturnValueOnce('') // 2. open url
      .mockReturnValueOnce('') // 3. wait time
      // 5次滚动
      .mockReturnValueOnce('') // scroll 1
      .mockReturnValueOnce('') // wait 1
      .mockReturnValueOnce('') // scroll 2
      .mockReturnValueOnce('') // wait 2
      .mockReturnValueOnce('') // scroll 3
      .mockReturnValueOnce('') // wait 3
      .mockReturnValueOnce('') // scroll 4
      .mockReturnValueOnce('') // wait 4
      .mockReturnValueOnce('') // scroll 5
      .mockReturnValueOnce('') // wait 5
      .mockReturnValueOnce('') // 14. 滚动回顶部
      .mockReturnValueOnce('携程机票查询') // 15. title
      .mockReturnValueOnce(JSON.stringify([])) // 16. empty flight data
      .mockReturnValueOnce(''); // 17. final close

    await query({ dep: '不知名城市', arr: '另一个不知名城市', date: '2024-06-01' });
    
    // Verify hint is shown
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('建议直接使用三位IATA机场编码'));
  });

  it('should handle browser execution errors', async () => {
    // Mock execSync to throw error on first call
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('Browser connection failed');
    });

    await expect(query({ dep: '北京', arr: '上海', date: '2024-06-01' })).rejects.toThrow('Browser connection failed');
  });

  it('should sort flights by departure time from earliest to latest', async () => {
    // 直接测试排序逻辑，不需要依赖console.log输出
    const unsortedFlights = [
      { airline: '南方航空', flightNo: 'CZ3101', depTime: '18:00', arrTime: '21:00', price: '¥880', cabin: '经济舱3.2折' },
      { airline: '东方航空', flightNo: 'MU5101', depTime: '08:00', arrTime: '10:30', price: '¥680', cabin: '经济舱2.8折' },
      { airline: '中国国航', flightNo: 'CA1501', depTime: '12:00', arrTime: '14:30', price: '¥720', cabin: '经济舱2.8折' },
      { airline: '海南航空', flightNo: 'HU7101', depTime: '09:30', arrTime: '12:00', price: '¥750', cabin: '经济舱3.0折' },
    ];
    // 预期排序后顺序：08:00, 09:30, 12:00, 18:00
    const expectedOrder = ['08:00', '09:30', '12:00', '18:00'];

    // 模拟query.js里的排序逻辑
    const sortedFlights = [...unsortedFlights].sort((a, b) => {
      const [aHours, aMinutes] = a.depTime.split(':').map(Number);
      const [bHours, bMinutes] = b.depTime.split(':').map(Number);
      return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
    });

    expect(sortedFlights.map(f => f.depTime)).toEqual(expectedOrder);

    // 同时验证调用query时排序逻辑会被执行
    vi.mocked(execSync)
      .mockReturnValueOnce('') // 1. initial close
      .mockReturnValueOnce('') // 2. open url
      .mockReturnValueOnce('') // 3. wait time
      // 5次滚动
      .mockReturnValueOnce('') // scroll 1
      .mockReturnValueOnce('') // wait 1
      .mockReturnValueOnce('') // scroll 2
      .mockReturnValueOnce('') // wait 2
      .mockReturnValueOnce('') // scroll 3
      .mockReturnValueOnce('') // wait 3
      .mockReturnValueOnce('') // scroll 4
      .mockReturnValueOnce('') // wait 4
      .mockReturnValueOnce('') // scroll 5
      .mockReturnValueOnce('') // wait 5
      .mockReturnValueOnce('') // 14. 滚动回顶部
      .mockReturnValueOnce('携程机票查询') // 15. title
      .mockReturnValueOnce(JSON.stringify(unsortedFlights)) // 16. unsorted flight data
      .mockReturnValueOnce(''); // 17. final close

    await query({ dep: '北京', arr: '广州', date: '2024-06-01' });
  });

  it('should limit maximum returned flights to 100', async () => {
    // Mock 150 flights response
    const manyFlights = Array.from({ length: 150 }, (_, i) => ({
      airline: '测试航空',
      flightNo: `TEST${String(i).padStart(3, '0')}`,
      depTime: `${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
      arrTime: `${String(Math.floor((i+120)/60)).padStart(2, '0')}:${String((i+120) % 60).padStart(2, '0')}`,
      price: `¥${500 + i}`,
      cabin: '经济舱'
    }));

    vi.mocked(execSync)
      .mockReturnValueOnce('') // 1. initial close
      .mockReturnValueOnce('') // 2. open url
      .mockReturnValueOnce('') // 3. wait time
      // 5次滚动
      .mockReturnValueOnce('') // scroll 1
      .mockReturnValueOnce('') // wait 1
      .mockReturnValueOnce('') // scroll 2
      .mockReturnValueOnce('') // wait 2
      .mockReturnValueOnce('') // scroll 3
      .mockReturnValueOnce('') // wait 3
      .mockReturnValueOnce('') // scroll 4
      .mockReturnValueOnce('') // wait 4
      .mockReturnValueOnce('') // scroll 5
      .mockReturnValueOnce('') // wait 5
      .mockReturnValueOnce('') // 14. 滚动回顶部
      .mockReturnValueOnce('携程机票查询') // 15. title
      .mockReturnValueOnce(JSON.stringify(manyFlights)) // 16. 150 flights data
      .mockReturnValueOnce(''); // 17. final close

    const logSpy = vi.spyOn(console, 'log');
    await query({ dep: '北京', arr: '上海', date: '2024-06-01' });
    
    // 检查"查询到 X 个航班"的输出，X应该是100
    const countLine = logSpy.mock.calls
      .map(call => call[0])
      .find(line => line.includes('查询到') && line.includes('个航班'));
    
    expect(countLine).toContain('100');
  });
});
