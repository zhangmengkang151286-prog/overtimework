/**
 * 定位服务
 *
 * 提供位置获取、权限请求和逆地理编码功能
 */

import * as ExpoLocation from 'expo-location';
import {errorHandlingService, RetryStrategies} from './ErrorHandlingService';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ProvinceCity {
  province: string;
  city: string;
}

export interface LocationInfo extends ProvinceCity {
  latitude?: number;
  longitude?: number;
}

export class LocationService {
  private static instance: LocationService;
  private readonly TIMEOUT_MS = 8000; // 8秒超时（缩短等待时间）

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * 请求定位权限
   * @returns 是否授权成功
   */
  public async requestLocationPermission(): Promise<boolean> {
    try {
      const {status} = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('请求定位权限失败:', error);
      return false;
    }
  }

  /**
   * 获取当前位置
   * @returns 位置坐标
   */
  public async getCurrentLocation(): Promise<Location> {
    try {
      // 检查权限
      const {status} = await ExpoLocation.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('定位权限未授予');
      }

      // 使用重试机制和超时控制
      return await errorHandlingService.executeWithRetry(async () => {
        // 使用Promise.race实现8秒超时
        const locationPromise = ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced, // 使用平衡精度（更快）
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('定位超时')), 8000);
        });

        const location = await Promise.race([locationPromise, timeoutPromise]);

        console.log('获取到的GPS坐标:', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        });

        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }, RetryStrategies.location);
    } catch (error: any) {
      errorHandlingService.logError(error, '获取位置', 'info');
      throw new Error(this.getLocationErrorMessage(error));
    }
  }

  /**
   * 根据坐标获取省份城市
   * @param latitude 纬度
   * @param longitude 经度
   * @returns 省份和城市信息
   */
  public async getProvinceCity(
    latitude: number,
    longitude: number,
  ): Promise<ProvinceCity> {
    try {
      // 使用Expo Location的逆地理编码
      const results = await ExpoLocation.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      console.log('逆地理编码结果:', JSON.stringify(results, null, 2));

      if (results && results.length > 0) {
        const result = results[0];

        console.log('[LocationService] 原始数据:', {
          region: result.region,
          city: result.city,
          subregion: result.subregion,
          district: result.district,
          name: result.name,
        });

        // 提取省份和城市信息
        // Expo Location返回的数据结构:
        // - region: 省份/州 (可能为 null)
        // - city: 城市 (如 "上海市")
        // - subregion: 子区域 (可能为 null)
        // - district: 区/县 (如 "浦东新区")

        // 直辖市列表
        const municipalities = ['北京市', '上海市', '天津市', '重庆市'];
        const municipalityKeywords = ['北京', '上海', '天津', '重庆', 'beijing', 'shanghai', 'tianjin', 'chongqing'];

        // 获取省份信息
        let province = result.region || result.subregion || '';
        console.log('[LocationService] 初始省份:', province);

        // 标准化省份名称
        if (province) {
          if (
            !province.includes('省') &&
            !province.includes('市') &&
            !province.includes('自治区') &&
            !province.includes('特别行政区')
          ) {
            province = this.normalizeChinaProvince(province);
          }
        }
        console.log('[LocationService] 标准化后省份:', province);

        // 判断是否为直辖市
        const isMunicipality = municipalities.includes(province) ||
          municipalityKeywords.some(k => province.toLowerCase().includes(k));

        // 获取城市信息：直辖市优先取 district（区），普通省份取 city
        let city = '';
        if (isMunicipality) {
          // 直辖市：city 应该是区名（如"浦东新区"），而不是"上海市"
          city = result.district || result.subregion || result.name || '';
          console.log('[LocationService] 直辖市，取区:', city);
        } else {
          city = result.city || result.district || result.subregion || '';
          console.log('[LocationService] 普通省份，取城市:', city);
        }

        // 标准化城市名称
        if (city) {
          if (
            !city.includes('市') &&
            !city.includes('区') &&
            !city.includes('县')
          ) {
            city = this.normalizeChinaCity(city);
          }
        }
        console.log('[LocationService] 标准化后城市:', city);

        // 如果省份为空，但城市是直辖市，则省份=城市
        if (!province && city) {
          if (municipalities.includes(city)) {
            province = city;
            // 直辖市时 city 应该是区，尝试取 district
            city = result.district || '';
            console.log('[LocationService] 检测到直辖市，省份=城市，区:', city);
          }
        }

        // 最终检查：如果省份还是空的，使用城市作为省份（针对直辖市）
        if (!province && city) {
          const cityLower = city.toLowerCase();
          if (cityLower.includes('beijing') || city.includes('北京')) {
            province = '北京市';
          } else if (cityLower.includes('shanghai') || city.includes('上海')) {
            province = '上海市';
          } else if (cityLower.includes('tianjin') || city.includes('天津')) {
            province = '天津市';
          } else if (cityLower.includes('chongqing') || city.includes('重庆')) {
            province = '重庆市';
          }
          console.log('[LocationService] 最终检查后省份:', province);
        }

        const finalResult = {
          province: province || '未知省份',
          city: city || '未知城市',
        };

        console.log('[LocationService] 最终结果:', finalResult);
        return finalResult;
      }

      throw new Error('无法解析位置信息');
    } catch (error: any) {
      console.error('逆地理编码失败:', error);
      throw new Error(`逆地理编码失败: ${error.message || error}`);
    }
  }

  /**
   * 标准化中国省份名称
   * @param province 原始省份名称
   * @returns 标准化后的省份名称
   */
  private normalizeChinaProvince(province: string): string {
    console.log('[LocationService] 标准化省份名称 - 输入:', province);

    // 常见省份拼音映射
    const provinceMap: {[key: string]: string} = {
      beijing: '北京市',
      shanghai: '上海市',
      tianjin: '天津市',
      chongqing: '重庆市',
      jiangsu: '江苏省',
      zhejiang: '浙江省',
      guangdong: '广东省',
      shandong: '山东省',
      henan: '河南省',
      hebei: '河北省',
      hubei: '湖北省',
      hunan: '湖南省',
      sichuan: '四川省',
      fujian: '福建省',
      anhui: '安徽省',
      jiangxi: '江西省',
      liaoning: '辽宁省',
      jilin: '吉林省',
      heilongjiang: '黑龙江省',
      shanxi: '山西省',
      shaanxi: '陕西省',
      gansu: '甘肃省',
      yunnan: '云南省',
      guizhou: '贵州省',
      qinghai: '青海省',
      hainan: '海南省',
      guangxi: '广西壮族自治区',
      xinjiang: '新疆维吾尔自治区',
      xizang: '西藏自治区',
      tibet: '西藏自治区',
      ningxia: '宁夏回族自治区',
      'inner mongolia': '内蒙古自治区',
      neimenggu: '内蒙古自治区',
      'hong kong': '香港特别行政区',
      hongkong: '香港特别行政区',
      macau: '澳门特别行政区',
      macao: '澳门特别行政区',
      taiwan: '台湾省',
    };

    const lowerProvince = province.toLowerCase().trim();
    console.log('[LocationService] 转换为小写:', lowerProvince);

    // 先尝试精确匹配
    if (provinceMap[lowerProvince]) {
      console.log(
        '[LocationService] 精确匹配成功:',
        provinceMap[lowerProvince],
      );
      return provinceMap[lowerProvince];
    }

    // 如果包含关键词，尝试模糊匹配
    for (const [key, value] of Object.entries(provinceMap)) {
      if (lowerProvince.includes(key) || key.includes(lowerProvince)) {
        console.log('[LocationService] 模糊匹配成功:', key, '→', value);
        return value;
      }
    }

    // 如果原始名称已经包含"省"、"市"等，直接返回
    if (
      province.includes('省') ||
      province.includes('市') ||
      province.includes('自治区') ||
      province.includes('特别行政区')
    ) {
      console.log('[LocationService] 已经是中文格式:', province);
      return province;
    }

    console.log('[LocationService] 无法匹配，返回原值:', province);
    return province;
  }

  /**
   * 标准化中国城市名称
   * @param city 原始城市名称
   * @returns 标准化后的城市名称
   */
  private normalizeChinaCity(city: string): string {
    console.log('[LocationService] 标准化城市名称 - 输入:', city);

    // 常见城市拼音映射（部分示例）
    const cityMap: {[key: string]: string} = {
      nanjing: '南京市',
      suzhou: '苏州市',
      wuxi: '无锡市',
      hangzhou: '杭州市',
      ningbo: '宁波市',
      guangzhou: '广州市',
      shenzhen: '深圳市',
      chengdu: '成都市',
      wuhan: '武汉市',
      xian: '西安市',
      zhengzhou: '郑州市',
      qingdao: '青岛市',
      dalian: '大连市',
      shenyang: '沈阳市',
      changsha: '长沙市',
      nanchang: '南昌市',
      fuzhou: '福州市',
      xiamen: '厦门市',
      kunming: '昆明市',
      guiyang: '贵阳市',
      lanzhou: '兰州市',
      taiyuan: '太原市',
      shijiazhuang: '石家庄市',
      harbin: '哈尔滨市',
      changchun: '长春市',
      urumqi: '乌鲁木齐市',
      lhasa: '拉萨市',
      // 直辖市
      beijing: '北京市',
      shanghai: '上海市',
      tianjin: '天津市',
      chongqing: '重庆市',
    };

    const lowerCity = city.toLowerCase().trim();
    console.log('[LocationService] 转换为小写:', lowerCity);

    // 先尝试精确匹配
    if (cityMap[lowerCity]) {
      console.log('[LocationService] 精确匹配成功:', cityMap[lowerCity]);
      return cityMap[lowerCity];
    }

    // 如果包含关键词，尝试模糊匹配
    for (const [key, value] of Object.entries(cityMap)) {
      if (lowerCity.includes(key) || key.includes(lowerCity)) {
        console.log('[LocationService] 模糊匹配成功:', key, '→', value);
        return value;
      }
    }

    // 如果原始名称已经包含"市"、"区"、"县"，直接返回
    if (city.includes('市') || city.includes('区') || city.includes('县')) {
      console.log('[LocationService] 已经是中文格式:', city);
      return city;
    }

    console.log('[LocationService] 无法匹配，返回原值:', city);
    return city;
  }

  /**
   * 获取完整的位置信息(包含坐标和省份城市)
   * @returns 完整的位置信息
   */
  public async getLocationInfo(): Promise<LocationInfo> {
    try {
      const location = await this.getCurrentLocation();
      const provinceCity = await this.getProvinceCity(
        location.latitude,
        location.longitude,
      );

      return {
        ...provinceCity,
        latitude: location.latitude,
        longitude: location.longitude,
      };
    } catch (error: any) {
      console.error('获取位置信息失败:', error);
      throw new Error(`获取位置信息失败: ${error.message || error}`);
    }
  }

  /**
   * 获取位置信息(带fallback)
   * 如果定位失败,返回null而不是抛出错误
   * @returns 位置信息或null
   */
  public async getLocationInfoWithFallback(): Promise<LocationInfo | null> {
    try {
      // 先请求权限
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        console.log('定位权限未授予,使用fallback');
        return null;
      }

      // 获取位置信息
      return await this.getLocationInfo();
    } catch (error) {
      console.log('定位失败,使用fallback:', error);
      return null;
    }
  }

  /**
   * 获取用户友好的定位错误信息
   * @param error 错误对象
   * @returns 用户友好的错误信息
   */
  private getLocationErrorMessage(error: any): string {
    if (error.message?.includes('权限')) {
      return '请授权定位权限以自动获取位置';
    }
    if (error.message?.includes('超时')) {
      return '定位超时,请手动选择省份城市';
    }
    if (error.message?.includes('不可用')) {
      return '定位服务不可用,请手动选择省份城市';
    }
    return '定位失败,请手动选择省份城市';
  }
}

// 导出单例实例
export const locationService = LocationService.getInstance();
