import type { MapLandmark, MapPath } from '../types'

export const mapBoundaryPaths: MapPath[] = [
  {
    id: 'hall-outline',
    label: '大會場館輪廓',
    d: 'M4 12 H92 V86 H4 Z',
  },
  {
    id: 'north-west-cut',
    label: '西北側斜牆',
    d: 'M31 12 L23 23 L23 30 L31 39 Z',
  },
  {
    id: 'main-entrance-gap',
    label: '世貿大門入口',
    d: 'M41 86 H57',
  },
]

export const mapWalkwayPaths: MapPath[] = [
  {
    id: 'central-spine',
    label: '中央主走道',
    d: 'M33 12 V86',
  },
  {
    id: 'right-spine',
    label: '右側主走道',
    d: 'M93 13 V82',
  },
  {
    id: 'bottom-spine',
    label: '南側入口走道',
    d: 'M4 86 H92',
  },
  {
    id: 'middle-cross',
    label: '中段橫向走道',
    d: 'M29 63 H92',
  },
  {
    id: 'upper-cross',
    label: '上段橫向走道',
    d: 'M40 38 H92',
  },
]

export const mapLandmarks: MapLandmark[] = [
  { id: 'ticket-west', label: '售票亭', type: 'ticket', bbox: { x: 28.5, y: 33.5, w: 4.5, h: 2.8 } },
  { id: 'ticket-east', label: '售票亭', type: 'ticket', bbox: { x: 84.5, y: 84.5, w: 6.5, h: 2.6 } },
  { id: 'restroom-1', label: '廁所', type: 'restroom', bbox: { x: 75.5, y: 27.8, w: 5.5, h: 9.5 } },
  { id: 'restroom-2', label: '廁所', type: 'restroom', bbox: { x: 41.8, y: 72.8, w: 4.6, h: 8.3 } },
  { id: 'atm-west', label: 'ATM', type: 'atm', bbox: { x: 25.5, y: 34.5, w: 3.2, h: 2.4 } },
  { id: 'atm-south', label: 'ATM', type: 'atm', bbox: { x: 51.8, y: 81.7, w: 3.2, h: 2.4 } },
  { id: 'service-center', label: '服務台', type: 'service', bbox: { x: 46.5, y: 65.0, w: 5.2, h: 13.0 } },
  { id: 'stage-a', label: 'A 舞台', type: 'stage', bbox: { x: 58.0, y: 73.0, w: 6.6, h: 13.5 } },
  { id: 'stage-b', label: 'B 舞台', type: 'stage', bbox: { x: 35.0, y: 73.0, w: 7.2, h: 13.5 } },
  { id: 'entrance-1', label: '1 號入口', type: 'entrance', bbox: { x: 66.0, y: 86.4, w: 7.5, h: 2.2 } },
  { id: 'entrance-2', label: '2 號入口', type: 'entrance', bbox: { x: 85.0, y: 86.4, w: 7.5, h: 2.2 } },
  { id: 'entrance-4', label: '4 號入口', type: 'entrance', bbox: { x: 92.4, y: 55.8, w: 3.0, h: 7.0 } },
  { id: 'entrance-6', label: '6 號入口', type: 'entrance', bbox: { x: 92.4, y: 43.5, w: 3.0, h: 7.0 } },
  { id: 'entrance-8', label: '8 號入口', type: 'entrance', bbox: { x: 92.4, y: 31.8, w: 3.0, h: 7.0 } },
  { id: 'entrance-14', label: '14 號入口', type: 'entrance', bbox: { x: 1.0, y: 57.0, w: 3.2, h: 7.0 } },
  { id: 'entrance-15', label: '15 號入口', type: 'entrance', bbox: { x: 1.0, y: 64.5, w: 3.2, h: 7.0 } },
]
