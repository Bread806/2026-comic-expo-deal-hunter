export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

export interface MapRect {
  x: number
  y: number
  w: number
  h: number
}

export type LandmarkType =
  | 'entrance'
  | 'ticket'
  | 'restroom'
  | 'atm'
  | 'stage'
  | 'service'
  | 'zone'

export interface MapLandmark {
  id: string
  label: string
  type: LandmarkType
  bbox: MapRect
}

export interface MapPath {
  id: string
  label?: string
  d: string
}

export type PrizeStatus = 'free' | 'conditional' | 'none'

export interface Prize {
  id?: string
  booth_id?: number
  name: string
  status: PrizeStatus
  condition: string
  quantity: string
  editor_name: string
  created_at?: string
  updated_at?: string
}

export interface Booth {
  id: number
  name: string
  bbox: BBox
  prizes?: Prize[]
}

export type FilterType = 'all' | 'free' | 'conditional'
