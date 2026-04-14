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
    // 4~9. 3次滚动，每次scroll + wait
    // 10. 滚动回顶部
    // 11. eval document.title
    // 12. eval flight data
    // 13. final close
    vi.mocked(execSync)
      .mockReturnValueOnce('') // 1. initial close
      .mockReturnValueOnce('') // 2. open url
      .mockReturnValueOnce('') // 3. wait time
      // 3次滚动
      .mockReturnValueOnce('') // scroll 1
      .mockReturnValueOnce('') // wait 1
      .mockReturnValueOnce('') // scroll 2
      .mockReturnValueOnce('') // wait 2
      .mockReturnValueOnce('') // scroll 3
      .mockReturnValueOnce('') // wait 3
      .mockReturnValueOnce('') // 10. 滚动回顶部
      .mockReturnValueOnce('携程机票查询') // 11. title
      .mockReturnValueOnce(JSON.stringify([ // 12. flight data
        { airline: '东方航空', flightNo: 'MU5101', depTime: '08:00', arrTime: '10:30', price: '¥680', cabin: '经济舱2.8折' },
        { airline: '中国国航', flightNo: 'CA1501', depTime: '09:00', arrTime: '11:30', price: '¥720', cabin: '经济舱2.8折' },
      ]))
      .mockReturnValueOnce(''); // 13. final close

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
      // 3次滚动
      .mockReturnValueOnce('') // scroll 1
      .mockReturnValueOnce('') // wait 1
      .mockReturnValueOnce('') // scroll 2
      .mockReturnValueOnce('') // wait 2
      .mockReturnValueOnce('') // scroll 3
      .mockReturnValueOnce('') // wait 3
      .mockReturnValueOnce('') // 10. 滚动回顶部
      .mockReturnValueOnce('携程机票查询') // 11. title
      .mockReturnValueOnce(JSON.stringify([ // 12. flight data
        { airline: '南方航空', flightNo: 'CZ3101', depTime: '08:00', arrTime: '11:00', price: '¥880', cabin: '经济舱3.2折' },
      ]))
      .mockReturnValueOnce(''); // 13. final close

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
      // 3次滚动
      .mockReturnValueOnce('') // scroll 1
      .mockReturnValueOnce('') // wait 1
      .mockReturnValueOnce('') // scroll 2
      .mockReturnValueOnce('') // wait 2
      .mockReturnValueOnce('') // scroll 3
      .mockReturnValueOnce('') // wait 3
      .mockReturnValueOnce('') // 10. 滚动回顶部
      .mockReturnValueOnce('携程机票查询') // 11. title
      .mockReturnValueOnce(JSON.stringify([])) // 12. empty flight data
      .mockReturnValueOnce(''); // 13. final close

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
});
