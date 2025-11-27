// オブジェクトの種別を定義
export type ObjectType = 'PANEL' | 'FRAME';
export type ImageType = 'RASTER' | 'VECTOR';
export type AssetType = 'PANEL' | 'CHARACTER' | 'ICON';

// 9方向の配置定義
export type TokenAlignment = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ImageAsset {
  id: string;
  src: string;
  thumbnail: string;
  type: AssetType;
  tags: string[];
}

export type SceneObject = {
  id: string;
  objectType: ObjectType; // PANEL か FRAME か

  isCommon?: boolean;
  isScript?: boolean;
  imageType?: ImageType;
  alignment?: TokenAlignment;

  // プロパティ
  src: string;  // 画像URL
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
};