/**
 * Province city SVG path data index (auto-generated)
 * Generated: 2026-04-03T03:54:25.945Z
 */

export interface CityPathData {
  name: string;
  path: string;
  cx: number;
  cy: number;
}

export interface ProvinceMapData {
  id: string;
  name: string;
  adcode: number;
  viewBox: string;
  cities: CityPathData[];
}

import beijingData from './beijing';
import tianjinData from './tianjin';
import hebeiData from './hebei';
import shanxiData from './shanxi';
import neimengguData from './neimenggu';
import liaoningData from './liaoning';
import jilinData from './jilin';
import heilongjiangData from './heilongjiang';
import shanghaiData from './shanghai';
import jiangsuData from './jiangsu';
import zhejiangData from './zhejiang';
import anhuiData from './anhui';
import fujianData from './fujian';
import jiangxiData from './jiangxi';
import shandongData from './shandong';
import henanData from './henan';
import hubeiData from './hubei';
import hunanData from './hunan';
import guangdongData from './guangdong';
import guangxiData from './guangxi';
import hainanData from './hainan';
import chongqingData from './chongqing';
import sichuanData from './sichuan';
import guizhouData from './guizhou';
import yunnanData from './yunnan';
import xizangData from './xizang';
import shaanxiData from './shaanxi';
import gansuData from './gansu';
import qinghaiData from './qinghai';
import ningxiaData from './ningxia';
import xinjiangData from './xinjiang';
import hongkongData from './hongkong';
import macauData from './macau';

const PROVINCE_MAP_DATA: Record<string, ProvinceMapData> = {
  'beijing': beijingData,
  'tianjin': tianjinData,
  'hebei': hebeiData,
  'shanxi': shanxiData,
  'neimenggu': neimengguData,
  'liaoning': liaoningData,
  'jilin': jilinData,
  'heilongjiang': heilongjiangData,
  'shanghai': shanghaiData,
  'jiangsu': jiangsuData,
  'zhejiang': zhejiangData,
  'anhui': anhuiData,
  'fujian': fujianData,
  'jiangxi': jiangxiData,
  'shandong': shandongData,
  'henan': henanData,
  'hubei': hubeiData,
  'hunan': hunanData,
  'guangdong': guangdongData,
  'guangxi': guangxiData,
  'hainan': hainanData,
  'chongqing': chongqingData,
  'sichuan': sichuanData,
  'guizhou': guizhouData,
  'yunnan': yunnanData,
  'xizang': xizangData,
  'shaanxi': shaanxiData,
  'gansu': gansuData,
  'qinghai': qinghaiData,
  'ningxia': ningxiaData,
  'xinjiang': xinjiangData,
  'hongkong': hongkongData,
  'macau': macauData,
};

const PROVINCE_NAME_TO_ID: Record<string, string> = {
  '北京': 'beijing',
  '天津': 'tianjin',
  '河北': 'hebei',
  '山西': 'shanxi',
  '内蒙古': 'neimenggu',
  '辽宁': 'liaoning',
  '吉林': 'jilin',
  '黑龙江': 'heilongjiang',
  '上海': 'shanghai',
  '江苏': 'jiangsu',
  '浙江': 'zhejiang',
  '安徽': 'anhui',
  '福建': 'fujian',
  '江西': 'jiangxi',
  '山东': 'shandong',
  '河南': 'henan',
  '湖北': 'hubei',
  '湖南': 'hunan',
  '广东': 'guangdong',
  '广西': 'guangxi',
  '海南': 'hainan',
  '重庆': 'chongqing',
  '四川': 'sichuan',
  '贵州': 'guizhou',
  '云南': 'yunnan',
  '西藏': 'xizang',
  '陕西': 'shaanxi',
  '甘肃': 'gansu',
  '青海': 'qinghai',
  '宁夏': 'ningxia',
  '新疆': 'xinjiang',
  '香港': 'hongkong',
  '澳门': 'macau',
};

export function getProvinceMapDataById(provinceId: string): ProvinceMapData | null {
  return PROVINCE_MAP_DATA[provinceId] || null;
}

export function getProvinceMapDataByName(provinceName: string): ProvinceMapData | null {
  const id = PROVINCE_NAME_TO_ID[provinceName];
  if (!id) return null;
  return PROVINCE_MAP_DATA[id] || null;
}

export function getAvailableProvinceIds(): string[] {
  return Object.keys(PROVINCE_MAP_DATA);
}
