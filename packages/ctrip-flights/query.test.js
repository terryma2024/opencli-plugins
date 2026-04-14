import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRegistry } from '@jackwener/opencli/registry';
import query from './query.js';

// 注册命令到测试环境
getRegistry().register('ctrip-flights/query', {
  description: 'Query flight information from Ctrip',
  func: query,
  options: {
    dep: { type: 'string', required: true },
    arr: { type: 'string', required: true },
    date: { type: 'string', required: true },
  },
});

describe('ctrip-flights query', () => {
  const command = getRegistry().get('ctrip-flights/query');
  
  beforeEach(() => {
    vi.unstubAllGlobals();
    // Mock execSync for all tests
    vi.stubGlobal('execSync', vi.fn());
  });

  it('should support Chinese city name input', async () => {
    // Mock successful response
    vi.mocked(execSync)
      // browser open
      .mockReturnValueOnce('')
      // wait time
      .mockReturnValueOnce('')
      // document.title
      .mockReturnValueOnce('携程机票查询')
      // body preview
      .mockReturnValueOnce('航班查询结果')
      // eval result
      .mockReturnValueOnce(JSON.stringify([
        { airline: '东方航空', flightNo: 'MU5101', depTime: '08:00', arrTime: '10:30', price: '¥680', cabin: '经济舱' },
        { airline: '中国国航', flightNo: 'CA1501', depTime: '09:00', arrTime: '11:30', price: '¥720', cabin: '经济舱' },
      ]))
      // browser close
      .mockReturnValueOnce('');

    const result = await command.func(null, { dep: '北京', arr: '上海', date: '2024-06-01' });
    
    // Verify execSync was called with correct URL
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('oneway-bjs-sha?depdate=2024-06-01'));
  });

  it('should support IATA airport code input', async () => {
    // Mock successful response
    vi.mocked(execSync)
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('携程机票查询')
      .mockReturnValueOnce('航班查询结果')
      .mockReturnValueOnce(JSON.stringify([
        { airline: '南方航空', flightNo: 'CZ3101', depTime: '08:00', arrTime: '11:00', price: '¥880', cabin: '经济舱' },
      ]))
      .mockReturnValueOnce('');

    const result = await command.func(null, { dep: 'PEK', arr: 'CAN', date: '2024-06-01' });
    
    // Verify execSync was called with correct URL (lowercase IATA code)
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('oneway-pek-can?depdate=2024-06-01'));
  });

  it('should reject when required parameters are missing', async () => {
    // Missing dep
    await expect(command.func(null, { arr: '上海', date: '2024-06-01' })).rejects.toThrow();
    // Missing arr
    await expect(command.func(null, { dep: '北京', date: '2024-06-01' })).rejects.toThrow();
    // Missing date
    await expect(command.func(null, { dep: '北京', arr: '上海' })).rejects.toThrow();
  });

  it('should show hint when no flights found', async () => {
    // Mock empty response
    vi.mocked(execSync)
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('携程机票查询')
      .mockReturnValueOnce('暂无航班数据')
      .mockReturnValueOnce(JSON.stringify([]))
      .mockReturnValueOnce('');

    // Capture console output
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation();
    
    await command.func(null, { dep: '不知名城市', arr: '另一个不知名城市', date: '2024-06-01' });
    
    // Verify hint is shown
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('建议直接使用三位IATA机场编码'));
    
    consoleLogSpy.mockRestore();
  });

  it('should handle browser execution errors', async () => {
    // Mock execSync to throw error
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('Browser connection failed');
    });

    await expect(command.func(null, { dep: '北京', arr: '上海', date: '2024-06-01' })).rejects.toThrow('Browser connection failed');
  });
});
